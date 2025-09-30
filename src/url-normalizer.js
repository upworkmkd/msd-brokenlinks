/**
 * URL Normalizer for MSD Broken Links Actor
 * 
 * @author MySmartDigital
 * @description Utility class for normalizing URLs to ensure consistent comparison
 * and avoid duplicate processing of the same page.
 */

class URLNormalizer {
    constructor() {
        // Common URL patterns to normalize
        this.trailingSlashPattern = /\/+$/;
        this.multipleSlashesPattern = /\/+/g;
        this.fragmentPattern = /#.*$/;
        this.queryPattern = /\?.*$/;
    }

    normalize(url) {
        try {
            const urlObj = new URL(url);
            
            // Remove fragment (hash)
            urlObj.hash = '';
            
            // Remove query parameters
            urlObj.search = '';
            
            // Normalize path
            let pathname = urlObj.pathname;
            
            // Remove trailing slashes except for root
            if (pathname !== '/' && pathname.endsWith('/')) {
                pathname = pathname.slice(0, -1);
            }
            
            // Replace multiple consecutive slashes with single slash
            pathname = pathname.replace(this.multipleSlashesPattern, '/');
            
            urlObj.pathname = pathname;
            
            // Convert to lowercase for hostname
            urlObj.hostname = urlObj.hostname.toLowerCase();
            
            // Ensure protocol is lowercase
            urlObj.protocol = urlObj.protocol.toLowerCase();
            
            return urlObj.href;
        } catch (error) {
            // If URL parsing fails, return original URL
            console.warn(`Failed to normalize URL: ${url}`, error.message);
            return url;
        }
    }

    isSameDomain(url1, url2) {
        try {
            const domain1 = new URL(url1).hostname.toLowerCase();
            const domain2 = new URL(url2).hostname.toLowerCase();
            return domain1 === domain2;
        } catch (error) {
            return false;
        }
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.toLowerCase();
        } catch (error) {
            return null;
        }
    }

    isInternalLink(url, baseUrl) {
        try {
            const urlDomain = new URL(url).hostname.toLowerCase();
            const baseDomain = new URL(baseUrl).hostname.toLowerCase();
            return urlDomain === baseDomain;
        } catch (error) {
            return false;
        }
    }
}

module.exports = { URLNormalizer };
