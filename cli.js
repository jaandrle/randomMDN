#!/usr/bin/env -S npx nodejsscript
/* jshint esversion: 11,-W097, -W040, module: true, node: true, expr: true, undef: true *//* global echo, $, pipe, s, fetch, cyclicLoop */
const url_main= "https://developer.mozilla.org/en-US/"
const url_sitemap= "https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz";
const url_web= url_main+"docs/Web";
/**
 * @typedef Article_object
 * @type {{ title: string, link: string, description: string }}
 * */
if($.isMain(import.meta))
	$.api("", true)
	.version(s.cat($.xdg.main`package.json`).xargs(JSON.parse).version)
	.describe([
		"This script posts a new random article from MDN¹ to a given mastodon instance.",
		"To post to the correct mastodon instance, use the `--url` and `--token` options.",
		"The script has been highly inspired by the similar project² for Twitter.",
		"",
		`[1] ${url_main}`,
		`[2] https://github.com/random-mdn/random-mdn-bot`
	])
	.option("--url", "instance url (e.g.: `https://mstdn.social`) – required")
	.option("--token", "a token for the mastodon account – required")
	.option("--publish", "sends post")
	.action(async function main({ url, token, publish }){
		if(!url) throw new Error("--url is required");
		if(!token) throw new Error("--token is required");

		const article= await randomMDN().then(compose);
		if(!publish) return echo(article);
		const res= await post({ url, token, article }).then(res=> res.json());
		echo(res);
		$.exit(0);
	})
	.parse();

/** @returns {Promise<Article_object>} */
export async function randomMDN(){
	const webDocUrls= await getWebDocUrls();
	const webDocUrls_len= webDocUrls.length;
	let candidate= {};
	while(!candidate.title)
		candidate= await pipe(
			()=> webDocUrls_len * Math.random(),
			random_number=> Math.floor(random_number),
			random_integer=> webDocUrls[random_integer],
			parseArticle
		)();
	return candidate;
}
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
/** @param {Article_object} article @returns {string} */
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
async function getWebDocUrls(){
	const sitemap= await fetch(url_sitemap, {
		responseType: 'buffer',
		headers: {
		'accept-encoding': 'gzip',
		},
	}).then(res=> res.text());

	return Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g))
		.map(([ _, url ])=> url)
		.filter(onlyAllowWebUrls);
};
/** @param {string} link @returns {Promise<Article_object | { title: null }>} */
async function parseArticle(link){
	const doc= await fetch(link).then(res=> res.text());
	// to not rely on exact words this matches the deprecation container
	if(/class="notecard deprecated"/.test(doc)) return {};
	
	const title= extractByRegexp(doc, /<h1>(.*?)<\/h1>/i);
	if(!title) return {};

	const inside_q= "(([^\"]|(?<=\\\\)\")*)";
	return {
		description: extractByRegexp(doc, new RegExp(`<meta name="description" content="${inside_q}"`, "i")) || "",
		title, link
	};
};

function extractByRegexp(str, regexp){
	const candidate= str.match(regexp);
	if(!candidate) return null;
	return candidate[1];
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
function onlyAllowWebUrls(url){ return url.startsWith(url_web); }
