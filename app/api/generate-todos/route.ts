import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { text, userId, imageUrl } = await request.json();

    if (!text || !userId) {
      return NextResponse.json(
        { error: 'Text and userId are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that parses todo items from text. 
          Please extract all todo items from the user's input.
          Return ONLY a JSON object with a key "todos" which is an array of strings, where each string is a todo title.
          Example: {"todos": ["Buy milk", "Walk the dog"]}
          Do not include any markdown formatting or explanation.`,
        },
        {
          role: 'user',
          content: text,
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
      image_url: imageUrl || null, // Add image to all generated todos if present
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
