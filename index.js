import "nodejsscript";
/**
 * @typedef Baseline
 * @type {{ baseline: false } | { baseline: "low", baseline_low_date: string } | { baseline: "high",, baseline_low_date: string, baseline_high_date: string }}
 * */
/**
 * @typedef Article_object
 * @type {{ title: string, link: string, description: string, updated: string, github_file: string, baseline?: Baseline }}
 * */
let webDocUrls;
/** @returns {Promise<Article_object>} */
export async function randomMDN(){
	if(!webDocUrls)
		webDocUrls= await getWebDocUrls();
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

import { url_sitemap, url_web } from './consts.js';
async function getWebDocUrls(){
	const sitemap= await fetch(url_sitemap, {
		responseType: 'buffer',
		headers: {
			'accept-encoding': 'gzip',
		},
	}).then(res=> res.text());

	return Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g))
		.map(([ _, url ])=> url)
		.filter(url=> url.startsWith(url_web));
}
/** @param {string} link @returns {Promise<Article_object | { title: null }>} */
async function parseArticle(link){
	const jsonEmpty= ()=> ({ isActive: false });
	const json= await fetch(link+"/index.json")
		.then(res=> res.json())
		.then(json=> json.doc || jsonEmpty())
		.catch(jsonEmpty);
	if(!json.isActive || isDeprecated(json)) return {};

	const pluck= (key, o= json)=> o[key] || "";
	return {
		title: pluck("title"),
		link,
		description: pluck("summary").replace(/\n */g, " "),
		updated: pluck("modified"),
		github_file: pluck("github_url", json.source || {}),
		baseline: pluck("baseline"),
	};
}
function isDeprecated({ body: [ opening ] }){
	if(!opening) return true;
	const { content }= opening?.value || {};
	if(!content) return true;
	return /class="notecard deprecated"/.test(content);
}
