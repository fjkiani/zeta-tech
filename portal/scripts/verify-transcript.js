const { YoutubeTranscript } = require('youtube-transcript');

async function test() {
    try {
        // A short Python Data Types video
        const url = 'https://www.youtube.com/watch?v=khCv3It9z2o';
        console.log(`Fetching transcript for: ${url}`);
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        console.log('Success! Items found:', transcript.length);
        console.log('First line:', transcript[0].text);
        console.log('Last line:', transcript[transcript.length - 1].text);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
