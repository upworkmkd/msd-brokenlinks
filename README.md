# MSD Broken Links Analysis Actor

A specialized Apify actor for analyzing broken links on websites. This actor crawls a specified number of pages starting from a homepage URL and identifies all broken internal and external links.

## Features

- **Focused Link Analysis**: Specifically designed for broken links detection
- **Configurable Page Crawling**: Set the maximum number of pages to analyze
- **Internal & External Link Checking**: Separate analysis for internal and external links
- **Batch Processing**: Efficient batch processing to avoid overwhelming target servers
- **Comprehensive Reporting**: Detailed reports with broken links categorized by status code
- **Social Media Filtering**: Excludes social media links from external link analysis
- **Protocol Support**: Handles mailto, tel, sms, and other special protocols

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd msd-brokenlinks
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Basic Usage

```bash
npm start
```

### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startUrl` | string | Yes | - | The homepage URL to start crawling from |
| `maxPages` | integer | Yes | 10 | Maximum number of pages to crawl and check |
| `userAgent` | string | No | Mozilla/5.0 (compatible; MSD-BrokenLinks/1.0) | User agent string for requests |
| `timeout` | integer | No | 10000 | Request timeout in milliseconds |
| `maxRedirects` | integer | No | 5 | Maximum number of redirects to follow |
| `includeExternalLinks` | boolean | No | true | Whether to check external links |
| `includeInternalLinks` | boolean | No | true | Whether to check internal links |
| `batchSize` | integer | No | 5 | Number of links to check simultaneously |

### Example Input

```json
{
  "startUrl": "https://example.com",
  "maxPages": 10,
  "userAgent": "Mozilla/5.0 (compatible; MSD-BrokenLinks/1.0)",
  "timeout": 10000,
  "maxRedirects": 5,
  "includeExternalLinks": true,
  "includeInternalLinks": true,
  "batchSize": 5
}
```

## Output Format

The actor returns a comprehensive analysis in the following format:

```json
{
  "domain": {
    "domain_name": "https://example.com",
    "total_pages_analyzed": 10,
    "total_links": 150,
    "total_broken_links": 5,
    "broken_links_percentage": 3,
    "total_internal_links": 120,
    "broken_internal_links": 2,
    "broken_internal_percentage": 2,
    "total_external_links": 30,
    "broken_external_links": 3,
    "broken_external_percentage": 10,
    "pages_with_successful_status": 9,
    "pages_with_error_status": 1,
    "all_broken_links": [...],
    "broken_links_by_status_code": {...},
    "analysis_summary": {
      "has_broken_links": true,
      "critical_issues": 2,
      "server_errors": 0,
      "timeout_errors": 1
    }
  },
  "pages": [
    {
      "url": "https://example.com",
      "pageStatusCode": 200,
      "analysis_date": "2024-01-01T00:00:00.000Z",
      "data_source": "msd_broken_links",
      "totalLinks": 15,
      "totalBrokenLinks": 1,
      "brokenLinksPercentage": 7,
      "internalLinksCount": 12,
      "externalLinksCount": 3,
      "internalLinks": [...],
      "externalLinks": [...],
      "brokenInternalLinks": 0,
      "brokenExternalLinks": 1
    }
  ],
  "analysis": {
    "total_pages_processed": 10,
    "analysis_completed_at": "2024-01-01T00:00:00.000Z",
    "broken_links_engine_version": "1.0.0",
    "data_format_version": "1.0"
  }
}
```

## Link Analysis Details

### Internal Links
- Links pointing to the same domain as the starting URL
- Includes relative and absolute internal links
- Excludes hash-only links (fragments)

### External Links
- Links pointing to different domains
- Excludes social media links (Facebook, Twitter, Instagram, etc.)
- Includes all other external domains

### Broken Link Detection
- Uses HTTP HEAD requests to check link status
- Considers status codes >= 400 as broken
- Handles special protocols (mailto, tel, sms, whatsapp)
- Provides detailed error messages for failed requests

### Status Code Categories
- **200-299**: Successful responses
- **300-399**: Redirects (considered valid)
- **400-499**: Client errors (broken links)
- **500-599**: Server errors (broken links)

## Development

### Running Tests
```bash
npm test
```

### Local Development
```bash
npm run dev
```

### API Server
```bash
npm run api
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Optional: Override default user agent
USER_AGENT=Mozilla/5.0 (compatible; MSD-BrokenLinks/1.0)

# Optional: Override default timeout
DEFAULT_TIMEOUT=10000

# Optional: Override default batch size
DEFAULT_BATCH_SIZE=5
```

## Performance Considerations

- **Batch Processing**: Links are processed in configurable batches to avoid overwhelming servers
- **Rate Limiting**: Small delays between batches to be respectful to target servers
- **Timeout Handling**: Configurable timeouts prevent hanging requests
- **Memory Management**: Efficient processing of large numbers of links

## Error Handling

The actor handles various error scenarios:
- Network timeouts
- DNS resolution failures
- Invalid URLs
- Server errors
- Redirect loops

All errors are logged and included in the final report for analysis.

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please contact MySmartDigital support.