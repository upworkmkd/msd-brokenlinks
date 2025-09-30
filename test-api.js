/**
 * Test script for MSD Broken Links Analysis API
 * 
 * @author MySmartDigital
 * @description Test script to verify the broken links analysis API functionality
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testHealthCheck() {
    try {
        console.log('Testing health check...');
        const response = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Health check passed:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

async function testBrokenLinksAnalysis() {
    try {
        console.log('\nTesting broken links analysis...');
        
        const testInput = {
            startUrl: 'https://httpbin.org',
            maxPages: 3,
            userAgent: 'Mozilla/5.0 (compatible; MSD-BrokenLinks-Test/1.0)',
            timeout: 10000,
            maxRedirects: 5,
            includeExternalLinks: true,
            includeInternalLinks: true,
            batchSize: 3
        };

        console.log('Input:', JSON.stringify(testInput, null, 2));

        const response = await axios.post(`${API_BASE_URL}/analyze`, testInput, {
            timeout: 60000 // 60 second timeout for the analysis
        });

        console.log('✅ Analysis completed successfully!');
        console.log('\n📊 Results Summary:');
        console.log(`- Domain: ${response.data.domain.domain_name}`);
        console.log(`- Pages Analyzed: ${response.data.domain.total_pages_analyzed}`);
        console.log(`- Total Links: ${response.data.domain.total_links}`);
        console.log(`- Broken Links: ${response.data.domain.total_broken_links}`);
        console.log(`- Broken Links Percentage: ${response.data.domain.broken_links_percentage}%`);
        console.log(`- Internal Broken: ${response.data.domain.broken_internal_links}`);
        console.log(`- External Broken: ${response.data.domain.broken_external_links}`);

        if (response.data.domain.all_broken_links.length > 0) {
            console.log('\n🔗 Broken Links Details:');
            response.data.domain.all_broken_links.forEach((link, index) => {
                console.log(`${index + 1}. ${link.url} (${link.statusCode}) - ${link.type}`);
                console.log(`   Anchor: "${link.anchorText}"`);
                console.log(`   Found on: ${link.foundOnPage}`);
                if (link.error) {
                    console.log(`   Error: ${link.error}`);
                }
                console.log('');
            });
        }

        console.log('\n📄 Page Details:');
        response.data.pages.forEach((page, index) => {
            console.log(`${index + 1}. ${page.url}`);
            console.log(`   Status: ${page.pageStatusCode}`);
            console.log(`   Total Links: ${page.totalLinks}`);
            console.log(`   Broken Links: ${page.totalBrokenLinks}`);
            console.log(`   Broken Percentage: ${page.brokenLinksPercentage}%`);
            console.log('');
        });

        return true;
    } catch (error) {
        console.error('❌ Analysis test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

async function testWithKnownBrokenLinks() {
    try {
        console.log('\nTesting with a site that might have broken links...');
        
        const testInput = {
            startUrl: 'https://httpbin.org',
            maxPages: 2,
            userAgent: 'Mozilla/5.0 (compatible; MSD-BrokenLinks-Test/1.0)',
            timeout: 5000,
            maxRedirects: 3,
            includeExternalLinks: true,
            includeInternalLinks: true,
            batchSize: 2
        };

        const response = await axios.post(`${API_BASE_URL}/analyze`, testInput, {
            timeout: 30000
        });

        console.log('✅ Known broken links test completed!');
        console.log(`- Total broken links found: ${response.data.domain.total_broken_links}`);
        
        return true;
    } catch (error) {
        console.error('❌ Known broken links test failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting MSD Broken Links Analysis API Tests\n');
    
    const healthCheck = await testHealthCheck();
    if (!healthCheck) {
        console.log('\n❌ Health check failed. Make sure the API server is running.');
        console.log('Run: npm run api');
        return;
    }

    const analysisTest = await testBrokenLinksAnalysis();
    const knownBrokenTest = await testWithKnownBrokenLinks();

    console.log('\n📋 Test Results Summary:');
    console.log(`- Health Check: ${healthCheck ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Analysis Test: ${analysisTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Known Broken Links Test: ${knownBrokenTest ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = healthCheck && analysisTest && knownBrokenTest;
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testHealthCheck,
    testBrokenLinksAnalysis,
    testWithKnownBrokenLinks,
    runAllTests
};
