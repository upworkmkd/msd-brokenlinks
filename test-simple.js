/**
 * Simple test script for MSD Broken Links Analysis
 * 
 * @author MySmartDigital
 * @description Simple test to verify basic functionality without API server
 */

const { BrokenLinksAnalyzer } = require('./src/broken-links-analyzer');
const { URLNormalizer } = require('./src/url-normalizer');
const axios = require('axios');

async function testBrokenLinksAnalyzer() {
    console.log('🧪 Testing Broken Links Analyzer...\n');

    try {
        // Initialize components
        const analyzer = new BrokenLinksAnalyzer({
            userAgent: 'Mozilla/5.0 (compatible; MSD-BrokenLinks-Test/1.0)',
            timeout: 10000,
            maxRedirects: 5,
            includeExternalLinks: true,
            includeInternalLinks: true,
            batchSize: 3
        });

        const urlNormalizer = new URLNormalizer();

        // Test URL
        const testUrl = 'https://example.com';
        console.log(`Testing with URL: ${testUrl}`);

        // Fetch page content
        console.log('Fetching page content...');
        const response = await axios.get(testUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MSD-BrokenLinks-Test/1.0)',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: function (status) {
                return status < 500;
            }
        });

        const html = response.data;
        const statusCode = response.status;
        const normalizedUrl = urlNormalizer.normalize(testUrl);
        const baseDomain = new URL(testUrl).origin;

        console.log(`Page fetched successfully (Status: ${statusCode})`);
        console.log(`Normalized URL: ${normalizedUrl}`);

        // Analyze broken links
        console.log('\nAnalyzing broken links...');
        const startTime = Date.now();
        
        const result = await analyzer.analyzePage({
            url: normalizedUrl,
            html,
            baseDomain
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`Analysis completed in ${duration}ms\n`);

        // Display results
        console.log('📊 Analysis Results:');
        console.log(`- Total Links: ${result.totalLinks}`);
        console.log(`- Broken Links: ${result.totalBrokenLinks}`);
        console.log(`- Broken Percentage: ${result.brokenLinksPercentage}%`);
        console.log(`- Internal Links: ${result.internalLinksCount}`);
        console.log(`- External Links: ${result.externalLinksCount}`);
        console.log(`- Broken Internal: ${result.brokenInternalLinks}`);
        console.log(`- Broken External: ${result.brokenExternalLinks}`);

        // Show broken links details
        if (result.internalLinks && result.internalLinks.length > 0) {
            const brokenInternal = result.internalLinks.filter(link => link.isBroken);
            if (brokenInternal.length > 0) {
                console.log('\n🔗 Broken Internal Links:');
                brokenInternal.forEach((link, index) => {
                    console.log(`${index + 1}. ${link.url} (${link.statusCode})`);
                    console.log(`   Anchor: "${link.anchorText}"`);
                    if (link.error) {
                        console.log(`   Error: ${link.error}`);
                    }
                });
            }
        }

        if (result.externalLinks && result.externalLinks.length > 0) {
            const brokenExternal = result.externalLinks.filter(link => link.isBroken);
            if (brokenExternal.length > 0) {
                console.log('\n🌐 Broken External Links:');
                brokenExternal.forEach((link, index) => {
                    console.log(`${index + 1}. ${link.url} (${link.statusCode})`);
                    console.log(`   Anchor: "${link.anchorText}"`);
                    if (link.error) {
                        console.log(`   Error: ${link.error}`);
                    }
                });
            }
        }

        // Show all links (for debugging)
        console.log('\n📋 All Links Summary:');
        if (result.internalLinks && result.internalLinks.length > 0) {
            console.log(`Internal Links (${result.internalLinks.length}):`);
            result.internalLinks.forEach((link, index) => {
                const status = link.isBroken ? '❌' : '✅';
                console.log(`  ${index + 1}. ${status} ${link.url} (${link.statusCode || 'pending'})`);
            });
        }

        if (result.externalLinks && result.externalLinks.length > 0) {
            console.log(`External Links (${result.externalLinks.length}):`);
            result.externalLinks.forEach((link, index) => {
                const status = link.isBroken ? '❌' : '✅';
                console.log(`  ${index + 1}. ${status} ${link.url} (${link.statusCode || 'pending'})`);
            });
        }

        console.log('\n✅ Test completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testBrokenLinksAnalyzer().catch(console.error);
}

module.exports = { testBrokenLinksAnalyzer };
