#!/usr/bin/env -S npx nodejsscript
/* jshint esversion: 11,-W097, -W040, module: true, node: true, expr: true, undef: true *//* global echo, $, pipe, s, fetch, cyclicLoop */
import "nodejsscript";
import { randomMDN } from './index.js';
import { url_main, env_names } from './consts.js';
$.api("randomMDN")
	.version("1.0.2")
	.describe([
		"This script posts a new random article from MDN¹ to a given mastodon instance.",
		"To post to the correct mastodon instance, use the `--url` and `--token` options.",
		"The script has been highly inspired by the similar project² for Twitter.",
		"",
		`[1] ${url_main}`,
		`[2] https://github.com/random-mdn/random-mdn-bot`
	])
.command("json", "Print random article as JSON")
	.action(()=> randomMDN().then(pipe( JSON.stringify, echo, $.exit.bind(null, 0) )))
.command("echo", "Print random article")
	.action(()=> randomMDN().then(pipe( echo, $.exit.bind(null, 0) )))
.command("text", "Print random article as text – default", { default: true })
	.action(()=> randomMDN().then(pipe( compose, echo, $.exit.bind(null, 0) )))
.command("mastodon", "Post to mastodon")
	.option("--url", "instance url (e.g.: `https://mstdn.social`) – required")
	.option("--token", "a token for the mastodon account – required")
	.action(async function mastodon({
		url= $.env[env_names.mastodon.url],
		token= $.env[env_names.mastodon.token]
	}){
		if(!url) $.error(`Can't post without a URL, please use the '--url' option or enviroment variable '${env_names.mastodon.url}'.`);
		if(!token) $.error(`Can't post without a token, please use the '--token' option or enviroment variable '${env_names.mastodon.token}'.`);

		const status= await randomMDN().then(compose);
		const res= await post({ url, token, status }).then(res=> res.json());
		echo(res);
		$.exit(0);
	})
.command("rss", "Prints RSS feed for beeing used for example in [Newsboat, an RSS reader](https://newsboat.org/).")
	.option("--limit, -l", "No. of articles to print – defaults to 3")
	.action(async function rss({ limit= 3 }){
		/** @type {import("./index.js").Article_object[]} */
		const articles= await pipe(
			length=> Array.from({ length }).map(randomMDN),
			a=> Promise.all(a)
		)(limit);
		const articles_rss= articles.map(articleEncodeEntities).map(function({ title, description, link, github_file, updated }){
			return [
				"<item>",
					"<title>"+title+"</title>",
					"<description>"+description+"</description>",
					"<link>"+link+"</link>",
					"<guid>"+github_file+"</guid>",
					"<lastBuildDate>"+(new Date(updated)).toUTCString()+"</lastBuildDate>",
				"</item>"
			].join("\n\t");
		});
		[
			`<?xml version="1.0" encoding="UTF-8" ?>`,
			`<rss version="2.0">`,
			"<channel>",
			`<title>🦖 Random MDN</title>`,
			`<link>${url_main}</link>`,
			...articles_rss,
			"</channel>",
			"</rss>"
		].forEach(l=> echo(l));
		$.exit(0);
	})
.parse();

/** @param {{ url: string, token: script, status: string }} def */
async function post({ url, token, status }){
	return fetch(new URL("api/v1/statuses", url), {
		method: "POST",
		headers: {
			Authorization: "Bearer "+token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ status, visibility: "public" })
	});
}
/** @param {import("./index.js").Article_object} article @returns {string} */
function compose({ title, description, link }){
	const limit= 500, reserve= 15;
	let { length }= description;
	const hashtags= getHashtags(link);
	description= description.slice(0,
		limit - reserve - title.length - link.length - hashtags.length);
	if(length - description.length) description+= "…";//….length= 1
	return [
		`🦖 ${title} 🦖`,//2×" 🦖".length= 6
		link,
		description,
		hashtags
	].join("\n\n");//3×"\n\n"= 6
}
/** @param {import("./index.js").Article_object} article @returns {string} */
function articleEncodeEntities({ ...article }){
	[ "title", "description" ]
		.forEach(key=> article[key]= textEncodeEntities(article[key]));
	return article;
}
function textEncodeEntities(text){//TODO: use lib?
	const translate= {
		" " : "nbsp",
		"&" : "amp",
		"\"": "quot",
		"'" : "apos",
		"<" : "lt",
		">" : "gt"
	};
	return text.replace(new RegExp(`(${Object.keys(translate).join("|")})`, "g"), function(_, entity) {
		return `&${translate[entity]};`;
	});
}
/**
 * Get appropriate hashtags for the URL
 * (probably can be way smarter and better)
 *
 * @param {string} url
 * @returns {string} fitting hashtags for the URL
 */
function getHashtags(url){
	let hashtags= "#webdev";
	const [ , section= "" ]= url.match(/Web\/(.*?)\//) || [];
		if([ "Accessibility", "HTTP",
			 "CSS", "HTML", "JavaScript",
			 "MathML", "SVG" ].includes(section))
		hashtags+= ` #${section}`;
  return hashtags;
}
