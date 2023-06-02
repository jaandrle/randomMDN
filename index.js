import "nodejsscript";
/**
 * @typedef Article_object
 * @type {{ title: string, link: string, description: string, updated: string, github_file: string }}
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
	const doc= await fetch(link).then(res=> res.text());
	// to not rely on exact words this matches the deprecation container
	if(/class="notecard deprecated"/.test(doc)) return {};
	
	const title= extractByRegexp(doc, /<h1>(.*?)<\/h1>/i);
	if(!title) return {};

	const inside_q= "(([^\"]|(?<=\\\\)\")*)";
	return {
		title, link,
		description: extractByRegexp(doc, new RegExp(`<meta name="description" content="${inside_q}"`, "i")) || "",
		updated: extractByRegexp(doc, new RegExp(`<time datetime="${inside_q}">`, "i")) || "",
		github_file: extractByRegexp(doc, new RegExp(`<a href="https://github.com/mdn/content/edit/main/files/${inside_q}"`, "i")) || ""
	};
}

function extractByRegexp(str, regexp){
	const candidate= str.match(regexp);
	if(!candidate) return null;
	return candidate[1];
}
