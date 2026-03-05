# タスクリスト（ダッシュボード型改修 追加要件）

- [x] `get_weather` ツールのAPI修正
  - [x] Open-Meteo から `wttr.in` などの、より確実に応答が返るシンプルなAPIへの変更
- [x] APIからの送受信データの整理 (`src/app/api/chat/route.ts`)
  - [x] LLMへ送信されたリクエストプロンプト内容を追加でキャプチャし、UIへ渡す構造の構築
- [x] UIでのアクター（LLM / Agent / User）の分離と可視化 (`src/app/page.tsx`)
  - [x] 自由入力フォームを削除し、サジェストボタンのみのUIへ変更
  - [x] 処理シーケンスの表示で、「User」「LLM（脳）」「Agent（システム）」のアクターを明記し、誰が何を行っているか視覚化する
  - [x] 「LLM送受信ログ」タブを改修し、「Agent → LLM (Prompt)」「LLM → Agent (Response)」の区分を明確にする
