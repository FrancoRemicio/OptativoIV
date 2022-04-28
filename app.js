const puppeteer = require('puppeteer');
const ObjectsToCsv = require('objects-to-csv');

(async () => {
    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage()
    await page.goto("https://www.mercadolibre.cl/categorias")
    let final = []
    const hrefcategories = await page.$$eval(".categories__container li a ", a => a.map(b => b.getAttribute("href")));


    for (const hrefcategory in hrefcategories) {


        const mercados = await browser.newPage()
        await mercados.goto(hrefcategories[hrefcategory],{timeout:0})

        if (!await mercados.$(".ui-search-rescue.ui-search-rescue--zrp ")){

            const hrefsubcategories = await mercados.$$eval(".ui-search-layout.ui-search-layout--stack .ui-search-result__image a ", a => a.map(b => b.getAttribute("href")));

            await mercados.waitForSelector(".andes-breadcrumb__link span")
            const category = await mercados.$eval(".andes-breadcrumb__link span",a => a.innerHTML);
            await mercados.waitForSelector(".ui-search-breadcrumb__title")
            const subcategory = await mercados.$eval(".ui-search-breadcrumb__title", a => a.innerHTML);

            await mercados.close()

            for (const hrefsubcategory in hrefsubcategories) {


                const categoria = await browser.newPage()
                await categoria.goto(hrefsubcategories[hrefsubcategory])
                const categorias = await categoria.evaluate( () => {

                    let a = []
                    let regex = /(\d+)/g

                    if (document.querySelector(".ui-pdp-reviews__rating__summary__average") != null){
                        a.push({
                            title: document.querySelector(".ui-pdp-title")?.innerText ?? null,
                            price: document.querySelector(".andes-money-amount__fraction")?.innerText ?? null,
                            rating: document.querySelector(".ui-pdp-reviews__rating__summary__average")?.innerText ?? null,
                            sales: document.querySelector(".ui-pdp-subtitle")?.innerText.match(regex)?.toString() ?? null,
                            opinionsTotal: document.querySelector(".ui-pdp-review__amount")?.innerText.match(regex)?.toString() ?? null,
                            image: document.querySelector(".ui-pdp-gallery__figure img")?.src ?? null,
                        })
                    }
                    return a

                })

                if (categorias.length > 0){
                    final.push({
                        category: category,
                        subcategory: subcategory,
                        title: categorias[0].title,
                        price: categorias[0].price,
                        rating: categorias[0].rating,
                        sales: categorias[0].sales,
                        opinionsTotal: categorias[0].opinionsTotal,
                        image: categorias[0].image
                    })
                }

                await categoria.close()

            }

            const csv = new ObjectsToCsv(final);

            await csv.toDisk('./mercadolibre.csv');

            // await csv.toDisk('./resultPorSi.csv',{append:true});
            // final = []
        }
        }
    await browser.close();

})()
