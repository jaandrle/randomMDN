#!/usr/bin/env -S npx nodejsscript
/* jshint esversion: 11,-W097, -W040, module: true, node: true, expr: true, undef: true *//* global echo, $, pipe, s, fetch, cyclicLoop */
import { randomMDN, url_main } from './index.js';
$.api("randomMDN")
.version(s.cat($.xdg.main`package.json`).xargs(JSON.parse).version)
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
.command("text", "Print random article as text")
	.action(()=> randomMDN().then(pipe( compose, echo, $.exit.bind(null, 0) )))
.command("mastodon", "Post to mastodon")
	.option("--url", "instance url (e.g.: `https://mstdn.social`) – required")
	.option("--token", "a token for the mastodon account – required")
	.action(async function mastodon({ url, token }){
		if(!url) throw new Error("--url is required");
		if(!token) throw new Error("--token is required");

		const status= await randomMDN().then(compose);
		const res= await post({ url, token, status }).then(res=> res.json());
		echo(res);
		$.exit(0);
	})
//todo RSS
.parse();

/** @param {{ url: string, token: script, status: string }} def */
async function post({ url, token, status }){
	return fetch(new URL("api/v1/statuses", url), {
		method: "POST",
		headers: {
			Authorization: "Bearer "+token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ status })
	});
}
/** @param {import("./index.js").Article_object} article @returns {string} */
function compose({ title, description, link }){
	const limit= 500, reserve= 15;
	let { length }= description;
	const hashtags= getHashtags(link).join(" ");
	description= description.slice(0,
		limit - reserve - title.length - link.length - hashtags.length);
	length-= description.length;
	if(length) description+= "…";//….length= 1
	return [
		`🦖 ${title} 🦖`,//2×" 🦖".length= 6
		link,
		description,
		hashtags
	].join("\n\n");//3×"\n\n"= 6
}
/**
 * Get appropriate hashtags for the URL
 * (probably can be way smarter and better)
 *
 * @param {String} url
 * @returns {Array} fitting hashtags for the URL
 */
function getHashtags(url){
	const hashtags= [ "#webdev" ];
	const [ , section ]= url.match(/Web\/(.*?)\//);
	const hashtagWorthySections = [
		"CSS",
		"Accessibility",
		"JavaScript",
		"HTTP",
		"HTML",
		"SVG",
	];
	if(hashtagWorthySections.includes(section))
		hashtags.push(`#${section}`);

  return hashtags;
}
