# Development Guide

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

## Accessing Output Data

**In Apify Platform:**
- **Key-Value Store**: Go to "Key-value store" tab and look for the `OUTPUT` key
- **Dataset**: Go to "Dataset" tab to see the array-wrapped data

**In Code:**
```javascript
// Get direct object (recommended)
const result = await Actor.getValue('OUTPUT');

// Get dataset data (array-wrapped)
const dataset = await Actor.getDataset();
const result = dataset.items[0]; // First (and only) item
```

**In API Response:**
The local API server returns the data directly as an object (not array-wrapped).

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

## Testing

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

## Integration with n8n

### n8n Integration Example

## License

MIT License - see LICENSE file for details.
