# 📺 Anime Manager - ハイブリッドアニメ管理システム

アニメの基本データはクラウド（Supabase）で共有、個人の評価・視聴状況はローカル（ブラウザ）に保存する管理システムです。

---

## 🚀 セットアップ手順（1から10まで）

### ステップ 1: Node.js の確認
ターミナル（PowerShell）で `node -v` を実行して、バージョンが表示されるか確認してください。

### ステップ 2: フォルダに移動
```bash
cd C:\Users\rn144\.gemini\antigravity\scratch\anime-vault
```

### ステップ 3: パッケージのインストール
```bash
npm install
```

### ステップ 4: Supabase プロジェクト作成
https://supabase.com/ でログインし、プロジェクトを作成してください。

### ステップ 5: Supabase テーブル作成（重要！）
1. 左メニュー **「SQL Editor」** をクリック
2. **「New query」** をクリック
3. **以下の SQL を全部コピーして貼り付け、実行（Run）してください**：

```sql
-- 作品データテーブルの作成（既存のテーブルがある場合は列を追加）
CREATE TABLE IF NOT EXISTS public.anime (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    synopsis TEXT DEFAULT '',
    pv_url TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    season TEXT DEFAULT '',
    total_episodes INTEGER DEFAULT 0,
    official_site TEXT DEFAULT '',
    copyright TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- すでにテーブルがある人向けの「列追加」コマンド（念のため実行してください）
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS official_site TEXT DEFAULT '';
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS copyright TEXT DEFAULT '';

-- 公開アクセス許可（読み取り・書き込み）
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.anime FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.anime FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.anime FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.anime FOR DELETE USING (true);
```

### ステップ 6: API キーの取得
1. 左下の **「Project Settings（歯車）」** → **「API」** をクリック
2. **Project URL** と **anon public key** をメモします。

### ステップ 7: 環境変数の設定 (ローカル & Vercel)

#### ローカル環境の場合：
フォルダ内に `.env.local` を作成し、以下を記述します。
```
NEXT_PUBLIC_SUPABASE_URL=https://あなたのID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのキー
```

#### Vercel（公開サイト）の場合（最重要！）：
1. Vercel のプロジェクト設定ページを開く
2. **「Settings」→「Environment Variables」** をクリック
3. `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を追加する
4. **追加後、一度 Git Push して再ビルドを行ってください。**

### ステップ 8: 起動
```bash
npm run dev
```

### ステップ 9: 作品登録
管理画面から作品を追加します。クラウド接続が成功していると、上部の警告が消えます。

### ステップ 10: デプロイ（更新）
```bash
git add .
git commit -m "update final"
git push
```

---

## ✨ 主な機能
- **クラウド同期**: 全デバイスで同じ作品リストを共有
- **マイライブラリ**: 自分だけの視聴ステータス管理（端末保存）
- **PV 自動再生**: 公式 YouTube 埋め込みで安定再生
- **XLSX インポート**: Excel ファイルから一括登録（画像URLも自動取得）
- **モダン UI**: 横スクロール、グラデーションカード、アニメーション
