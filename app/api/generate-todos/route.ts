import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { text, userId, imageUrl, base64Image } = await request.json();

    if ((!text && !imageUrl && !base64Image) || !userId) {
      return NextResponse.json(
        { error: 'Text/Image and userId are required' },
        { status: 400 }
      );
    }

    // 决策逻辑：
    // 1. 如果有图片 (base64 或 url) -> 强制使用豆包 Vision 模型
    // 2. 如果只有文字 -> 使用 DeepSeek 模型
    
    let apiKey = process.env.DEEPSEEK_API_KEY;
    let baseURL = process.env.DEEPSEEK_BASE_URL;
    let model = 'deepseek-chat';
    let useVision = false;

    // 只要有图片资源就使用 Vision 模式
    if (imageUrl || base64Image) {
      if (!process.env.DOUBAO_API_KEY || !process.env.DOUBAO_MODEL_ID) {
         return NextResponse.json(
          { error: 'Doubao API configuration missing for image analysis' },
          { status: 500 }
        );
      }
      apiKey = process.env.DOUBAO_API_KEY;
      baseURL = process.env.DOUBAO_BASE_URL;
      model = process.env.DOUBAO_MODEL_ID;
      useVision = true;
    }

    console.log(`Using AI Provider: ${useVision ? 'Doubao (Vision)' : 'DeepSeek (Text)'}, Model: ${model}`);

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });

    // 构造消息内容
    let userContent: any = text;
    
    if (useVision) {
      // 优先使用 Base64 图片，因为这能避免 AI 下载图片时的网络问题
      const finalImageUrl = base64Image || imageUrl;
      
      userContent = [
        { 
          type: 'text', 
          text: text || "请分析这张图片，识别并提取其中的所有待办事项（Todo List）。" 
        },
        { 
          type: 'image_url', 
          image_url: { 
            url: finalImageUrl 
          } 
        }
      ];
    }

    const completion = await openai.chat.completions.create({
      model: model!,
      messages: [
        {
          role: 'system',
          content: `你是一个高效的待办事项提取助手。
          请从用户的输入（文字或图片）中提取所有待办事项。
          
          要求：
          1. 只返回一个 JSON 对象，包含一个名为 "todos" 的数组。
          2. "todos" 数组中的每个元素应该是待办事项的标题字符串。
          3. 保持待办事项的原文和源语言（中文、英文等），不要进行翻译或改写，除非是为了修正明显的识别错误。
          4. 不要包含任何 Markdown 格式（如 \`\`\`json）、前言或后语，只返回纯 JSON 字符串。
          5. 如果图片或文字中没有明确的待办事项，请返回空数组。
          
          示例输出：
          {"todos": ["买牛奶", "下午三点开会", "Reply to emails"]}
          `,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('JSON parse error:', e);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    const todoTitles = parsed.todos;

    if (!Array.isArray(todoTitles) || todoTitles.length === 0) {
      return NextResponse.json(
        { message: 'No todos found' },
        { status: 200 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const todosToInsert = todoTitles.map((title: string) => ({
      user_id: userId,
      title: title,
      completed: false,
      // image_url: imageUrl || null, // 图片仅用于分析，不再保存到数据库中
    }));

    const { error } = await supabase.from('todos').insert(todosToInsert);

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save todos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: todoTitles.length });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
