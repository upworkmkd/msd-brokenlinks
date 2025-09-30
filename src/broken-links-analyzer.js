/**
 * Broken Links Analyzer for MSD Broken Links Actor
 * 
 * @author MySmartDigital
 * @description Core broken links analysis engine that extracts and validates links
 * from web pages, checking their status codes and identifying broken links.
 */

const cheerio = require('cheerio');
const axios = require('axios');

class BrokenLinksAnalyzer {
    constructor(options = {}) {
        this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; MSD-BrokenLinks/1.0)';
        this.timeout = options.timeout || 10000;
        this.maxRedirects = options.maxRedirects || 5;
        this.includeExternalLinks = options.includeExternalLinks !== false;
        this.includeInternalLinks = options.includeInternalLinks !== false;
        this.batchSize = options.batchSize || 5;
        this.cheerio = cheerio;
    }

    async analyzePage({ url, html, baseDomain }) {
        const $ = this.cheerio.load(html);
        
        // Extract all links from the page
        const linksAnalysis = await this.analyzeLinks($, url, baseDomain);
        
        return {
            totalLinks: linksAnalysis.totalLinks,
            totalBrokenLinks: linksAnalysis.totalBrokenLinks,
            brokenLinksPercentage: linksAnalysis.brokenLinksPercentage,
            internalLinksCount: linksAnalysis.internalLinksCount,
            externalLinksCount: linksAnalysis.externalLinksCount,
            internalLinks: linksAnalysis.internalLinks,
            externalLinks: linksAnalysis.externalLinks,
            brokenInternalLinks: linksAnalysis.brokenInternalLinks,
            brokenExternalLinks: linksAnalysis.brokenExternalLinks
        };
    }

    async analyzeLinks($, baseUrl, baseDomain) {
        const links = $('a[href]');
        let internalLinksCount = 0;
        let externalLinksCount = 0;
        const internalLinks = [];
        const externalLinks = [];
        
        // Social media domains to exclude from external links
        const socialMediaDomains = [
            'facebook.com', 'fb.com', 'm.facebook.com',
            'twitter.com', 't.co', 'x.com',
            'instagram.com', 'linkedin.com',
            'youtube.com', 'youtu.be',
            'pinterest.com', 'tiktok.com',
            'snapchat.com', 'whatsapp.com',
            'telegram.org', 'discord.com',
            'reddit.com', 'tumblr.com',
            'flickr.com', 'vimeo.com',
            'medium.com', 'github.com',
            'bit.ly', 'tinyurl.com', 'goo.gl'
        ];
        
        links.each((_, link) => {
            const href = $(link).attr('href');
            const anchorText = $(link).text().trim();
            
            if (href) {
                try {
                    const url = new URL(href, baseUrl);
                    const baseHost = new URL(baseUrl).hostname;
                    
                    // Skip hash-only links (fragments pointing to same page)
                    const baseUrlObj = new URL(baseUrl);
                    const isHashOnlyLink = (
                        url.href === baseUrl + '#' || 
                        url.href === baseUrl + '#content' ||
                        (url.pathname === baseUrlObj.pathname && url.hash && url.hash !== '') ||
                        (url.pathname === '/' && url.hash && url.hash !== '') ||
                        (url.pathname.endsWith('/') && url.hash && url.hash !== '' && url.pathname === baseUrlObj.pathname) ||
                        href.endsWith('#') // Links ending with just #
                    );
                    
                    if (isHashOnlyLink) {
                        return; // Skip this link
                    }
                    
                    const linkData = {
                        url: url.href,
                        anchorText: anchorText,
                        statusCode: null,
                        isBroken: false,
                        error: null
                    };
                    
                    if (url.hostname === baseHost) {
                        // Internal link
                        if (this.includeInternalLinks) {
                            internalLinksCount++;
                            internalLinks.push(linkData);
                        }
                    } else {
                        // External link
                        if (this.includeExternalLinks) {
                            // Check if it's a social media link
                            const isSocialMedia = socialMediaDomains.some(domain => 
                                url.hostname === domain || url.hostname.endsWith('.' + domain)
                            );
                            
                            if (!isSocialMedia) {
                                externalLinksCount++;
                                externalLinks.push(linkData);
                            }
                        }
                    }
                } catch (e) {
                    // Invalid URL, skip
                }
            }
        });
        
        // Check link status codes
        if (this.includeInternalLinks && internalLinks.length > 0) {
            await this.checkLinkStatuses(internalLinks);
        }
        if (this.includeExternalLinks && externalLinks.length > 0) {
            await this.checkLinkStatuses(externalLinks);
        }
        
        const brokenInternalLinks = internalLinks.filter(link => link.isBroken).length;
        const brokenExternalLinks = externalLinks.filter(link => link.isBroken).length;
        const totalBrokenLinks = brokenInternalLinks + brokenExternalLinks;
        const totalValidLinks = internalLinksCount + externalLinksCount;
        
        return {
            internalLinksCount,
            externalLinksCount,
            internalLinks,
            externalLinks,
            brokenInternalLinks,
            brokenExternalLinks,
            totalBrokenLinks,
            totalLinks: totalValidLinks,
            brokenLinksPercentage: totalValidLinks > 0 ? Math.round((totalBrokenLinks / totalValidLinks) * 100) : 0
        };
    }

    async checkLinkStatuses(links) {
        // Process links in batches to avoid overwhelming servers
        for (let i = 0; i < links.length; i += this.batchSize) {
            const batch = links.slice(i, i + this.batchSize);
            
            const promises = batch.map(async (link) => {
                // Handle mailto links specially
                if (link.url.startsWith('mailto:')) {
                    const emailAddress = link.url.substring(7); // Remove 'mailto:' prefix
                    
                    // Check if there's a valid email address after mailto:
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (emailAddress && emailAddress.trim() && emailRegex.test(emailAddress.trim())) {
                        link.statusCode = 200;
                        link.isBroken = false;
                        link.error = null;
                    } else {
                        link.statusCode = 400;
                        link.isBroken = true;
                        link.error = 'Invalid email address in mailto link';
                    }
                    return;
                }
                
                // Handle other protocols (tel:, sms:, etc.) as valid
                if (link.url.startsWith('tel:') || link.url.startsWith('sms:') || link.url.startsWith('whatsapp:')) {
                    link.statusCode = 200;
                    link.isBroken = false;
                    link.error = null;
                    return;
                }
                
                // For HTTP/HTTPS links, check with HEAD request
                try {
                    const response = await axios.head(link.url, {
                        headers: {
                            'User-Agent': this.userAgent
                        },
                        timeout: this.timeout,
                        maxRedirects: this.maxRedirects,
                        validateStatus: function (status) {
                            return status < 500; // Accept all status codes below 500
                        }
                    });
                    
                    link.statusCode = response.status;
                    link.isBroken = response.status >= 400;
                    
                } catch (error) {
                    link.statusCode = error.response?.status || 0;
                    link.isBroken = true;
                    link.error = error.message;
                }
            });
            
            await Promise.all(promises);
            
            // Small delay between batches to be respectful
            if (i + this.batchSize < links.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }
}

module.exports = { BrokenLinksAnalyzer };
