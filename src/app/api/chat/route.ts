import { google } from '@ai-sdk/google';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    let searchCount = 0;

    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const systemPrompt = `あなたは親切で有能なAIアシスタントです。現在の日本時間は ${now} です。
ユーザーの意図を汲み取り、以下のツールを必要に応じて自動で選択・実行して回答してください。
回答は必ず日本語で行ってください。ツールを複数回ループさせないよう、必要な情報を一度に取得するよう心がけてください。重要ルールとしては日時に関しては必ず明記すること。（いつの天気や、いつ公開されたニュースであるかなど）`;

    const toolsDefinition = {
      search: tool({
        description: 'ウェブ上の最新情報を検索します。ニュース、事実確認などに使用してください。',
        inputSchema: z.object({
          query: z.string().describe('検索キーワード'),
          topic: z.enum(['general', 'news']).optional().describe('検索のトピック。"news" を指定すると直近のニュースに絞り込みます。'),
          days: z.number().optional().describe('ニュース検索の場合の対象日数（デフォルト: 3）。'),
        }),
        execute: async ({ query, topic = 'general', days = 3 }) => {
          if (searchCount >= 1) return { error: '検索は1回までです。再検索は行わないでください。' };
          searchCount++;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const body: any = {
            api_key: process.env.TAVILY_API_KEY,
            query,
            search_depth: 'advanced',
            include_answer: true,
            max_results: 5,
          };

          if (topic === 'news') {
            body.topic = 'news';
            body.days = days;
          }

          const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) throw new Error(`Tavily search failed: ${response.status}`);
          const data = await response.json();
          return {
            results: data.results,
            answer: data.answer // include_answerの内容も返す
          };
        },
      }),
      get_weather: tool({
        description: '指定した地域の天気予報を取得します。',
        inputSchema: z.object({
          location: z.string().describe('取得したい都道府県や都市名（例: 東京, 大阪, 福岡）※必ず日本語で指定してください'),
        }),
        execute: async ({ location }: { location: string }) => {
          try {
            // 1. エリアXMLから都市名に対応するcityコードを取得する
            const areaRes = await fetch('https://weather.tsukumijima.net/primary_area.xml');
            if (!areaRes.ok) return { error: 'Failed to fetch area data' };
            const areaXml = await areaRes.text();

            // 例: <city title="東京" id="130010"
            const regex = new RegExp(`<city[^>]*title="([^"]*${location}[^"]*)"[^>]*id="(\\d+)"`);
            const match = areaXml.match(regex);

            if (!match) {
              return { error: `Location '${location}' not found in the area list. Please try a major city name in Japanese.` };
            }
            const cityCode = match[2];
            const cityName = match[1];

            // 2. cityコードを使って天気APIを叩く
            const res = await fetch(`https://weather.tsukumijima.net/api/forecast?city=${cityCode}`);
            if (!res.ok) return { error: 'Failed to fetch weather data from tsukumijima API' };

            const data = await res.json();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const forecasts = data.forecasts?.map((f: any) => ({
              dateLabel: f.dateLabel, // "今日", "明日", etc.
              date: f.date,           // "2026-03-02", etc.
              weather: f.telop,
              temperatureText: `最高 ${f.temperature?.max?.celsius || '不明'}℃ / 最低 ${f.temperature?.min?.celsius || '不明'}℃`,
            })) || [];

            return {
              location: cityName,
              forecasts,
              description: data.description?.bodyText || ''
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (e: any) {
            return { error: e.message };
          }
        },
      }),
    };

    // ステップごとの情報を記録する配列
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stepsData: any[] = [];

    const result = await generateText({
      model: google('gemini-3-flash-preview'),
      stopWhen: stepCountIs(5),
      system: systemPrompt,
      prompt: prompt,
      tools: toolsDefinition,
      onStepFinish: (step) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = step as any;
        stepsData.push({
          text: step.text,
          toolCalls: step.toolCalls,
          toolResults: step.toolResults,
          usage: step.usage,
          requestMessages: s.request?.body || null,
          responseMessages: s.response?.body || null,
        });
      }
    });

    // ツール定義スキーマをクライアントに返すためにシリアライズ可能な形に変換
    const extractedSchema = Object.entries(toolsDefinition).map(([name, t]) => ({
      name,
      description: t.description,
      parameters: "Zod Schema (省略)" // 実際のZodスキーマを綺麗にパースするのは難しいため簡易化
    }));

    return new Response(JSON.stringify({
      finalAnswer: result.text,
      steps: stepsData,
      systemPrompt: systemPrompt,
      toolsSchema: extractedSchema,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes('429')) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Too many requests to API.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: err.message || 'An error occurred' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
