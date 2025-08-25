
# Vibe Planner — деплой на Vercel

## Быстрый путь (через GitHub)
1. Создай пустой репозиторий на GitHub (например, `vibe-planner`).
2. Содержимое этой папки залей в репозиторий (в корень).
3. На https://vercel.com/new выбери **Import Git Repository** → выбери твой репозиторий.
4. Framework: **Other** (или None). Build Command: **(пусто)**. Output Directory: **/** (или оставить пустым).
5. Нажми **Deploy**. Через ~30 секунд появится URL вида `https://vibe-planner.vercel.app`.

## Альтернатива (Vercel CLI)
1. Установи Node.js и `npm i -g vercel`.
2. В папке проекта запусти `vercel` → следуй шагам → затем `vercel --prod`.

## Подключение к Telegram
1. Открой @BotFather → **/mybots → Bot Settings → Menu Button → Add Web App**.
2. Название: **Vibe Planner**.
3. URL: публичный URL, который дал Vercel.
