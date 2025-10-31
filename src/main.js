/**
 * MSD Broken Links Analysis Actor - Main Entry Point
 * 
 * @author MySmartDigital
 * @description Analyzes websites for broken links by crawling a specified number of pages
 * starting from a homepage URL. Focuses specifically on link validation and status checking.
 */

const { Actor } = require('apify');
const axios = require('axios');
const { BrokenLinksAnalyzer } = require('./broken-links-analyzer');
const { URLNormalizer } = require('./url-normalizer');

Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        startUrl = 'https://example.com',
        maxPages = 10,
        userAgent = 'Mozilla/5.0 (compatible; MSD-BrokenLinks/1.0)',
        timeout = 10000,
        maxRedirects = 5,
        includeExternalLinks = true,
        includeInternalLinks = true,
        batchSize = 5
    } = input;

    console.log('Starting MSD Broken Links Analysis...');
    console.log('Input:', JSON.stringify(input, null, 2));

    // Initialize components
    const brokenLinksAnalyzer = new BrokenLinksAnalyzer({
        userAgent,
        timeout,
        maxRedirects,
        includeExternalLinks,
        includeInternalLinks,
        batchSize
    });
    const urlNormalizer = new URLNormalizer();

    try {
        const results = [];
        const visitedUrls = new Set();
        // Normalize start URL before adding to processing queue
        const normalizedStartUrl = urlNormalizer.normalize(startUrl);
        const urlsToProcess = [normalizedStartUrl];
        let processedCount = 0;
        
        // Extract domain from normalized start URL
        const baseDomain = new URL(normalizedStartUrl).origin;
        
        while (urlsToProcess.length > 0 && processedCount < maxPages) {
            const currentUrl = urlsToProcess.shift();
            
            // Check if already visited (currentUrl is already normalized)
            if (visitedUrls.has(currentUrl)) {
                console.log(`Skipping already processed URL: ${currentUrl}`);
                continue;
            }
            visitedUrls.add(currentUrl);
            
            console.log(`Processing: ${currentUrl} (${processedCount + 1}/${maxPages})`);
            
            try {
                // Fetch page content
                const response = await axios.get(currentUrl, {
                    headers: {
                        'User-Agent': userAgent,
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                    },
                    timeout: timeout,
                    maxRedirects: maxRedirects,
                    validateStatus: function (status) {
                        return status < 500; // Accept all status codes below 500
                    }
                });

                const html = response.data;
                const statusCode = response.status;
                
                // Use normalized URL (currentUrl is already normalized)
                const normalizedUrl = currentUrl;
                
                // Analyze broken links on this page
                const brokenLinksData = await brokenLinksAnalyzer.analyzePage({
                    url: normalizedUrl,
                    html,
                    baseDomain
                });
                
                // Create page result
                const pageResult = {
                    url: normalizedUrl,
                    pageStatusCode: statusCode,
                    analysis_date: new Date().toISOString(),
                    data_source: 'msd_broken_links',
                    ...brokenLinksData
                };

                results.push(pageResult);
                
                // Track this page analysis as a billable event for monetization
                const currentCount = (await Actor.getValue('PAGE_ANALYZED')) || 0;
                await Actor.setValue('PAGE_ANALYZED', currentCount + 1);
                
                console.log(`Completed analysis for: ${normalizedUrl} (Status: ${statusCode})`);
                console.log(`Found ${brokenLinksData.totalBrokenLinks} broken links out of ${brokenLinksData.totalLinks} total links`);
                
                // Extract internal links for further crawling
                if (brokenLinksData.internalLinks && brokenLinksData.internalLinks.length > 0) {
                    for (const linkObj of brokenLinksData.internalLinks) {
                        try {
                            const link = linkObj.url || linkObj;
                            let fullUrl;
                            if (link.startsWith('http')) {
                                fullUrl = link;
                            } else if (link.startsWith('/')) {
                                fullUrl = baseDomain + link;
                            } else {
                                fullUrl = new URL(link, normalizedUrl).href;
                            }
                            
                            const normalizedLink = urlNormalizer.normalize(fullUrl);
                            
                            // Only add if it's from the same domain and not already visited
                            if (normalizedLink.startsWith(baseDomain) && 
                                !visitedUrls.has(normalizedLink) && 
                                !urlsToProcess.includes(normalizedLink)) {
                                urlsToProcess.push(normalizedLink);
                                console.log(`Added to crawl queue: ${normalizedLink}`);
                            }
                        } catch (e) {
                            // Skip invalid URLs
                            continue;
                        }
                    }
                }
                
                processedCount++;
                
            } catch (error) {
                console.error(`Error analyzing ${currentUrl}:`, error);

                // Determine status code based on error type
                let statusCode = 500;
                if (error.response) {
                    statusCode = error.response.status;
                } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    statusCode = 404;
                } else if (error.code === 'ETIMEDOUT') {
                    statusCode = 408;
                } else if (error.code === 'ECONNRESET') {
                    statusCode = 503;
                }

                // Add error result
                results.push({
                    url: currentUrl,
                    error: error.message,
                    pageStatusCode: statusCode,
                    analysis_date: new Date().toISOString(),
                    data_source: 'msd_broken_links',
                    totalLinks: 0,
                    totalBrokenLinks: 0,
                    brokenLinksPercentage: 0,
                    internalLinks: [],
                    externalLinks: [],
                    brokenInternalLinks: 0,
                    brokenExternalLinks: 0
                });
            }
        }
        
        // Calculate domain-level analysis
        const domainAnalysis = calculateDomainAnalysis(results, baseDomain);

        // Create comprehensive result structure
        const finalOutput = {
            domain: domainAnalysis,
            pages: results,
            analysis: {
                total_pages_processed: results.length,
                analysis_completed_at: new Date().toISOString(),
                broken_links_engine_version: '1.0.0',
                data_format_version: '1.0'
            }
        };

        // Set the comprehensive result as the main output
        await Actor.setValue('OUTPUT', finalOutput);
        
        // Also push to dataset for compatibility
        await Actor.pushData(finalOutput);

        const pagesAnalyzedCount = results.length;
        console.log(`Broken Links Analysis completed! Processed ${pagesAnalyzedCount} pages.`);
        console.log(`Billable events (pages analyzed): ${pagesAnalyzedCount}`);
        console.log(`Total broken links found: ${domainAnalysis.total_broken_links}`);
        console.log(`Broken links percentage: ${domainAnalysis.broken_links_percentage}%`);

    } catch (error) {
        console.error('General error:', error);
    }
});

// Domain-level analysis calculation
function calculateDomainAnalysis(results, baseDomain) {
    console.log('Calculating domain-level analysis...');

    // Calculate totals across all pages
    const totalLinks = results.reduce((sum, r) => sum + (r.totalLinks || 0), 0);
    const totalBrokenLinks = results.reduce((sum, r) => sum + (r.totalBrokenLinks || 0), 0);
    const totalInternalLinks = results.reduce((sum, r) => sum + (r.internalLinksCount || 0), 0);
    const totalExternalLinks = results.reduce((sum, r) => sum + (r.externalLinksCount || 0), 0);
    const brokenInternalLinks = results.reduce((sum, r) => sum + (r.brokenInternalLinks || 0), 0);
    const brokenExternalLinks = results.reduce((sum, r) => sum + (r.brokenExternalLinks || 0), 0);

    // Calculate percentages
    const brokenLinksPercentage = totalLinks > 0 ? Math.round((totalBrokenLinks / totalLinks) * 100) : 0;
    const brokenInternalPercentage = totalInternalLinks > 0 ? Math.round((brokenInternalLinks / totalInternalLinks) * 100) : 0;
    const brokenExternalPercentage = totalExternalLinks > 0 ? Math.round((brokenExternalLinks / totalExternalLinks) * 100) : 0;

    // Status code analysis
    const statusCodes = results.filter(r => r.pageStatusCode).map(r => r.pageStatusCode);
    const successfulPages = statusCodes.filter(code => code >= 200 && code < 300).length;
    const errorPages = statusCodes.filter(code => code >= 400).length;

    // Collect all broken links for detailed reporting
    const allBrokenLinks = [];
    results.forEach(page => {
        if (page.internalLinks) {
            page.internalLinks.forEach(link => {
                if (link.isBroken) {
                    allBrokenLinks.push({
                        url: link.url,
                        anchorText: link.anchorText,
                        statusCode: link.statusCode,
                        type: 'internal',
                        foundOnPage: page.url
                    });
                }
            });
        }
        if (page.externalLinks) {
            page.externalLinks.forEach(link => {
                if (link.isBroken) {
                    allBrokenLinks.push({
                        url: link.url,
                        anchorText: link.anchorText,
                        statusCode: link.statusCode,
                        type: 'external',
                        foundOnPage: page.url
                    });
                }
            });
        }
    });

    // Group broken links by status code
    const brokenLinksByStatusCode = {};
    allBrokenLinks.forEach(link => {
        const statusCode = link.statusCode || 'unknown';
        if (!brokenLinksByStatusCode[statusCode]) {
            brokenLinksByStatusCode[statusCode] = [];
        }
        brokenLinksByStatusCode[statusCode].push(link);
    });

    const domainAnalysis = {
        domain_name: baseDomain,
        total_pages_analyzed: results.length,
        
        // Link statistics
        total_links: totalLinks,
        total_broken_links: totalBrokenLinks,
        broken_links_percentage: brokenLinksPercentage,
        
        // Internal links
        total_internal_links: totalInternalLinks,
        broken_internal_links: brokenInternalLinks,
        broken_internal_percentage: brokenInternalPercentage,
        
        // External links
        total_external_links: totalExternalLinks,
        broken_external_links: brokenExternalLinks,
        broken_external_percentage: brokenExternalPercentage,
        
        // Page status analysis
        pages_with_successful_status: successfulPages,
        pages_with_error_status: errorPages,
        pages_with_successful_status_percentage: Math.round((successfulPages / results.length) * 100),
        pages_with_error_status_percentage: Math.round((errorPages / results.length) * 100),
        
        // Detailed broken links
        all_broken_links: allBrokenLinks,
        broken_links_by_status_code: brokenLinksByStatusCode,
        
        // Summary
        analysis_summary: {
            has_broken_links: totalBrokenLinks > 0,
            critical_issues: brokenLinksByStatusCode['404']?.length || 0,
            server_errors: brokenLinksByStatusCode['500']?.length || 0,
            timeout_errors: brokenLinksByStatusCode['408']?.length || 0
        }
    };

    console.log(`Domain Analysis Summary:`);
    console.log(`- Domain: ${baseDomain}`);
    console.log(`- Total Links: ${totalLinks}`);
    console.log(`- Broken Links: ${totalBrokenLinks} (${brokenLinksPercentage}%)`);
    console.log(`- Internal Broken: ${brokenInternalLinks} (${brokenInternalPercentage}%)`);
    console.log(`- External Broken: ${brokenExternalLinks} (${brokenExternalPercentage}%)`);

    return domainAnalysis;
}
