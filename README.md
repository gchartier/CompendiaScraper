# Compendia Web Scraper

## About

This web scraper crawls [PreviewsWorld's New Releases](https://www.previewsWorld.com/NewReleases) page every week for the American comic books that are slated for release in comic shops that week, and parses them into JSON data. After the parse is finished, all of the comics are saved into a "Staged Releases" JSON file where they can be manually reviewed for any errors and then committed to a PostgreSQL database with the covers hosted on AWS S3. It is used by [Compendia](https://github.com/gchartier/Compendia), as the source of it's data.

## How to Use

### To parse the releases and commit them to a database:
1. Clone this repository and install all of the dependencies
2. Add PostgreSQL and AWS S3 environment variables to the .env file
3. Run "npm run parse" to scrape the releases and parse them into JSON found under /log/todays-date-StagedReleases.json
4. Manually review the log under /log/todays-date.log for any warnings or errors and resolve them in the staged releases file
5. Run "npm run commit" to commit the staged releases into PostgreSQL and the covers into AWS S3

### To run the parser against one or more releases for debugging purposes:
1. Take the unparsedTitle, unparsedCreators, and unparsedFormat fields from the releases you want to test in staged releases and put them into the array in /test/testComics.js.
2. Run "npm run test-releases" and the results will be printed in the console for manual review. This is helpful if the scraper is not parsing correctly and you want to debug.

## Technologies Used

-   Node.js
-   AWS SDK / AWS S3 - For storing cover images
-   Cheerio - For traversing and parsing HTML
-   Pg - For PostgreSQL integration
-   ResembleJs - For identifying PreviewsWorld placeholder cover images
-   Winston - For logging

## Problem

While developing Compendia, a comic book collecting web application, I realized I needed to get accurate comic data every week to display in the app. Unfortunately, there were no resources online that provided comic data every week that also included cover images.

## Action

I researched all of the possible ways I could retrieve this data, and eventually found PreviewsWorld which is a branch of the largest comic book distributor in America, Diamond Comic Distributors, used by almost every comic book retailer in the US. I built a robust web scraper for this site that gets all of the information I needed, in a format that is clear and concise, that also respects the robots.txt, terms of service, and general scraping ethics such as not overloading regular usage metrics of the site.

## Result

The scraper works better than I could have hoped for despite many struggles I ran into with inconsistencies in the data. It is used every week by me to retrieve the data needed for Compendia to be useful.


## Future Development

I will continue to maintain this as it is a crucial part of [Compendia](https://github.com/gchartier/Compendia).
### Plans for future developments:
-   Host on AWS to be run every week at the same time so that it does not need to be manually run.
-   Test thoroughly
-   Automate error reporting to email or mobile push notifications so that I am aware of any parsing errors that need to be corrected
-   Simplify format and item number patterns to make it more scalable, readable, and maintainable
