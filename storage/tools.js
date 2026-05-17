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

async function getImagesByCharacter(characterName) {
    const url = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${characterName}+ai_generated+rating:explicit&json=1&api_key=e3fbe95e3675eca026266efc2f21f43e65cd2b8f3607eeadaf82e418038111f9ea31b731aa9901982c82c94b797547379b99eb54ace980a0b8cf1274574a74d5&user_id=5922029`
    const urlsankaku = `https://sankakuapi.com/v2/posts/keyset?lang=en&default_threshold=2&hide_posts_in_books=in-larger-tags&limit=40&page=1&tags=threshold:2+file_type:image+${characterName}`
    const { data } = await axios.get(urlsankaku, {
        headers: {
            "origin": "https://www.sankakucomplex.com",
            "Referer": "https://www.sankakucomplex.com/",
            "Accept": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMwMzgyNDYsInN1Ykx2bCI6MCwibGV2ZWwiOjIwLCJpc3MiOiJodHRwczovL2NhcGktdjIuc2Fua2FrdWNvbXBsZXguY29tIiwidHlwZSI6IkJlYXJlciIsImF1ZCI6ImNvbXBsZXgiLCJzY29wZSI6ImNvbXBsZXgiLCJpYXQiOjE3NzA3NDIwMDMsImV4cCI6MTc3MTM0NjgwM30.YFR7RKn4VwLSk_ir9yudl__y42e_EJR9jqNzQF6LLec",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
        }
    });
    const responseData = data.data || [];
    return responseData
        .filter(r => r && r.sample_url)
        .map(r => r.sample_url);
    //return ["no image found"];
}


async function getImages(query) {
    const serpUrl = `https://serpapi.com/search.json?engine=yandex_images&text=${query}&yandex_domain=yandex.ru&family_mode=0&api_key=428b54194b5805b47536826f6bac81845e46d95c0e0f0775f19f865d1dd10f7d`;
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
    getImagesByCharacter,
};

