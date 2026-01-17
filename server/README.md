# GW Market Server

Backend server for the Guild Wars trading marketplace.

## Scripts

Development and testing utilities located in `scripts/`.

### Socket Order Emitter

Simulates live trading activity by generating random shop orders and emitting them via Socket.IO.

```bash
npx ts-node scripts/socket-order-emitter.ts [options]
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `--url=URL` | `http://localhost:3026` | Server URL to connect to |
| `--interval=MS` | `1000` | Interval between order updates (ms) |
| `--shops=N` | `5` | Number of concurrent shops to simulate |
| `--items-per-shop=N` | `10-30` | Items per shop (random range) |
| `--refresh=MS` | `30000` | Shop refresh interval (ms) |

**Example:**
```bash
# Run with 10 shops, faster updates
npx ts-node scripts/socket-order-emitter.ts --shops=10 --interval=500
```

### Historical Data Generator

Generates large datasets of historical orders for testing analytics and database performance.

```bash
npx ts-node scripts/generate-history.ts [options]
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `--count=N` | `1000000` | Total orders to generate |
| `--output=FILE` | `data/history/orders.json` | Output file path |
| `--format=FORMAT` | `json` | Output format: `json`, `jsonl`, `mongo` |

**Example:**
```bash
# Generate 500k orders in JSONL format
npx ts-node scripts/generate-history.ts --count=500000 --format=jsonl
```

## Configuration

### Generator Config (`data/generator-config.json`)

Configuration file containing all Guild Wars game data used by the generator scripts:

- **Weapon data**: attributes, prefixes, suffixes, inscriptions, damage types
- **Professions**: all 10 GW professions
- **Materials**: common and rare crafting materials
- **Consumables**: alcohol, sweets, tonics, summoning stones
- **Items**: runes, insignias, keys, presents, hero armors
- **Services**: runs, dungeons, elite areas
- **Player names**: prefixes and suffixes for generating player names
- **Price ranges**: min/max values for each currency type (Plat, Ecto, ZKey, Arm)
- **Quantity ranges**: per item family

**Structure:**
```json
{
  "weaponAttributes": ["Strength", "Axe Mastery", ...],
  "professions": ["Warrior", "Ranger", ...],
  "weaponPrefixes": ["Barbed", "Cruel", ..Ma.],
  "priceRanges": {
    "PLAT": { "min": 1, "max": 1000 },
    "ECTO": { "min": 1, "max": 500 }
  },
  ...
}
```

## Requirements

Before running scripts, install dependencies:

```bash
npm install
npm install socket.io-client  # Required for socket-order-emitter
```
