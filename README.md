# MST3K Ranks

A small web app that visualizes Mystery Science Theater 3000 episode rankings from a [Reddit community poll](https://www.reddit.com/r/MST3K/comments/1rgqoys/comment/o7wpg27/)). It uses Borda (weighted) scoring (rank #1 = 5 pts down to #5 = 1 pt) and presents the results as a leaderboard, heatmap, and neighbor graph.

Built with Next.js, React, Tailwind CSS, and D3.

## Fork & develop

1. Fork the repo on GitHub, then clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/mst3k-ranks.git
   cd mst3k-ranks
   ```

2. Install dependencies (pnpm is used in this project):

   ```bash
   pnpm install
   ```

3. Run the dev server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

4. Make changes in your fork. When you’re ready to contribute back, open a pull request from your fork’s branch to the upstream repo.
