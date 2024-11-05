# randomMDN
This repository posts a random article from [MDN Web Docs](https://developer.mozilla.org/en-US/).
It is also a npm package exporting method `randomMDN`.

For automatic posting, the [GitHub Action](https://docs.github.com/en/actions) is used,
see [`.github/workflows/scheduled-posts.yml`](./.github/workflows/scheduled-posts.yml).

Inspired by [Random MDN (@randomMDN) / Twitter](https://twitter.com/randomMDN).

## Mastodon
You can find the bot on [randomMDN (@randomMDN@front-end.social) - Front-End Social](https://front-end.social/@randomMDN).

## RSS
You can find the rss feed on [front-end.social/@randomMDN.rss](https://front-end.social/@randomMDN.rss)[^MaR].

## NPM & CLI
1. Instalation (for now for early adapters)
	1. latest *lts* version of NodeJS ⇒ for installation follow [nvm-sh/nvm: Node Version Manager](https://github.com/nvm-sh/nvm)[^ORnpm]
	1. `npm install https://github.com/jaandrle/randomMDN --location=global`
1. usage cli
	```bash
	>_:randomMDN --help

	Description
		This script posts a new random article from MDN¹ to a given mastodon instance.
		To post to the correct mastodon instance, use the `--url` and `--token` options.
		The script has been highly inspired by the similar project² for Twitter.
		
		[1] https://developer.mozilla.org/en-US/
		[2] https://github.com/random-mdn/random-mdn-bot

	Usage
		$ randomMDN <command> [options]

	Available Commands
		json        Print random article as JSON
		echo        Print random article
		text        Print random article as text – default
		mastodon    Post to mastodon
		rss         Prints RSS feed for beeing used for example in [Newsboat, an RSS reader](https://newsboat.org/).

	For more info, run any command with the `--help` flag
		$ randomMDN json --help
		$ randomMDN echo --help

	Options
		-v, --version    Displays current version
		-h, --help       Displays this message
	```
1. usage package: `import { randomMDN } from "randomMDN";`

## Acknowledgments
- [random-mdn/random-mdn-bot: Serverless functions tweeting/sending/... random MDN articles](https://github.com/random-mdn/random-mdn-bot)
- [A Beginner's Guide to the Mastodon API - Post a Status Update with cURL or Python - DEV Community](https://dev.to/bitsrfr/getting-started-with-the-mastodon-api-41jj)
- [Simple Mastodon bot in 100 lines.](https://gist.github.com/NeKzor/e7d8551c4f55fbe4ec16252e0f6fa012)

[^MaR]: FYI: [Mastodon and RSS](https://derekkedziora.com/notes/20221112094802)
[^ORnpm]: Alternatively `curl -sL install-node.vercel.app/lts | bash`
