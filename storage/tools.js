const axios = require("axios");
const { imageSearch } = require("@mudbill/duckduckgo-images-api");

async function getImagesSafer(query) {
    try {
        const images = await imageSearch({
            query: query,
            safe: false,
            retries: 3,
        });
        return images.slice(0, 5).map((r) => ({
            title: r.title,
            url: r.image,
        }));
    } catch (error) {
        console.error("Image search error:", error.message);
        return null;
    }
}

async function getImages(query) {
    const serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${query}&location=Austin,+Texas,+United+States&google_domain=google.com&hl=en&gl=us&safe=off&api_key=428b54194b5805b47536826f6bac81845e46d95c0e0f0775f19f865d1dd10f7d`;
    const { data } = await axios.get(serpUrl);
    return data.images_results.slice(0, 10).map((r) => r.original);
}

async function get_current_weather(lat, lon) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const { data } = await axios.get(weatherUrl);
    return data.current_weather;
}

async function getCurrentTime(timezone) {
    const { data } = await axios.get(
        `https://timeapi.io/api/time/current/zone?timeZone=${encodeURIComponent(timezone)}`
    );
    return {
        timezone: data.timeZone,
        datetime: data.dateTime,
        date: data.date,
        time: data.time,
        dayOfWeek: data.dayOfWeek
    };
}

async function get_current_coin_price(coin, currency) {
    const { data } = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${currency}`
    );
    return data;
}

async function web_search(query) {
    const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query
    )}&count=3&safesearch=off`;
    const searchHeaders = {
        "X-Subscription-Token": `BSArJcr2VGVf-wMH5oT__Sr9YJy0a69`,
        Accept: "application/json",
    };
    const { data } = await axios.get(searchUrl, { headers: searchHeaders });
    return data.web.results.map((r) => ({
        title: r.title,
        url: r.url,
        description: r.description,
    }));
}

module.exports = {
    get_current_weather,
    getCurrentTime,
    get_current_coin_price,
    web_search,
    getImages,
    getImagesSafer,
};