#!/usr/bin/env -S npx nodejsscript
/* jshint esversion: 11,-W097, -W040, module: true, node: true, expr: true, undef: true *//* global echo, $, pipe, s, fetch, cyclicLoop */
const url_main= "https://developer.mozilla.org/en-US/"
const url_sitemap= "https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz";
const url_web= url_main+"docs/Web";
/**
 * @typedef Article_object
 * @type {{ title: string, link: string, description: string }}
 * */
$.api("", true)
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
.action(async function main({ url, token }){
	if(!url) throw new Error("--url is required");
	if(!token) throw new Error("--token is required");

	const webDocUrls= await getWebDocUrls();
	const webDocUrls_len= webDocUrls.length;
	/** @type {Article_object} */
	let candidate= {};
	while(!candidate.title)
		candidate= await pipe(
			()=> webDocUrls_len * Math.random(),
			random_number=> Math.floor(random_number),
			random_integer=> webDocUrls[random_integer],
			article
		)();
	const res= await post({ url, token, article: candidate }).then(res=> res.json());
	echo(res);
	$.exit(0);
})
.parse();

/**
 * @param {{
 *	url: string,
 *	token: script,
 *	article: Article_object
 *	}} def
 * */
async function post({ url, token, article }){
	const status= compose(article);
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
	const limit= 500, reserve= 10;
	let { length }= description;
	description= description.slice(0, limit - reserve - title.length - link.length);
	length-= description.length;
	if(length) description+= "…";//1
	return [
		title,
		description,
		link
	].join("\n\n");//2×2
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
async function article(link){
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
function onlyAllowWebUrls(url){ return url.startsWith(url_web); }
