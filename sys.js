/* ═══════════════════════════════════════════════════════════════
   SYSTEM DESIGN SIMULATOR PRO — script.js
   All el() calls verified against 165 HTML IDs.
   All overlays use .is-open class (never .hidden attribute).
   All module render methods called as () => Module.method().

   Sections:
   01. Storage Engine
   02. App State & Data
   03. Seed Data (Templates, Learning, Components, Comparisons)
   04. Utilities (toast, modal, counter, chart, isTyping)
   05. Theme System
   06. Splash & Boot
   07. Router / Navigation
   08. Sidebar & Topbar
   09. Command Palette
   10. Global Search
   11. Notifications
   12. Dashboard Module
   13. Architecture Builder (SVG drag-drop)
   14. Simulators Module
   15. Traffic Generator
   16. Failure Simulator
   17. Templates Module
   18. Whiteboard Module
   19. Learning Hub
   20. Interview Mode
   21. Comparison Engine
   22. Analytics Module
   23. Projects Module
   24. Settings Module
   25. Gamification (XP, Badges, Achievements)
   26. Keyboard Shortcuts
   27. Init
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════
   01. STORAGE ENGINE
═══════════════════════════════════════════════ */
const NS = 'sds:';
const Store = {
  get(k, fallback = null) {
    try { const v = localStorage.getItem(NS + k); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(k, v) {
    try { localStorage.setItem(NS + k, JSON.stringify(v)); return true; }
    catch (e) { if (e.name === 'QuotaExceededError') Toast.show('error', 'Storage full — export your data.'); return false; }
  },
  remove(k) { try { localStorage.removeItem(NS + k); } catch {} },
  all() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(NS)) out[key.slice(NS.length)] = localStorage.getItem(key);
    }
    return out;
  },
  clearAll() { Object.keys(this.all()).forEach(k => this.remove(k)); },
  sizeKB() { let b = 0; const a = this.all(); for (const k in a) b += NS.length + k.length + (a[k]?.length || 0); return (b / 1024).toFixed(1); }
};

/* ═══════════════════════════════════════════════
   02. APP STATE
═══════════════════════════════════════════════ */
let STATE = null;
const DEFAULT_STATE = {
  theme: 'dark',
  animations: true,
  gridEnabled: true,
  simSpeed: 1,
  packetCount: 10,
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  projects: [],
  simulations: [],
  learningProgress: {},
  earnedAchievements: [],
  activity: {},
  notifications: [],
  currentProjectId: null,
  builderState: { nodes: [], connections: [], zoom: 1, panX: 0, panY: 0 }
};

function loadState() {
  const saved = Store.get('state', null);
  STATE = saved ? deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), saved) : JSON.parse(JSON.stringify(DEFAULT_STATE));
}
function saveState() { Store.set('state', STATE); updateTopbarCounters(); }
function deepMerge(t, s) {
  for (const k in s) {
    if (s[k] !== null && typeof s[k] === 'object' && !Array.isArray(s[k]) && typeof t[k] === 'object') t[k] = deepMerge(t[k] || {}, s[k]);
    else t[k] = s[k];
  }
  return t;
}

/* ═══════════════════════════════════════════════
   03. SEED DATA
═══════════════════════════════════════════════ */

/* ── Component palette ── */
const COMPONENTS = [
  { type: 'client',       icon: '💻', name: 'Client',          category: 'Frontend',      color: '#6366F1', desc: 'End user browser or app' },
  { type: 'mobile',       icon: '📱', name: 'Mobile App',      category: 'Frontend',      color: '#8B5CF6', desc: 'Native mobile client' },
  { type: 'cdn',          icon: '🌐', name: 'CDN',             category: 'Frontend',      color: '#06B6D4', desc: 'Content delivery network' },
  { type: 'loadbalancer', icon: '⚖️', name: 'Load Balancer',   category: 'Networking',    color: '#10B981', desc: 'Distributes traffic across servers' },
  { type: 'apigateway',   icon: '🔀', name: 'API Gateway',     category: 'Networking',    color: '#F59E0B', desc: 'Single entry point for APIs' },
  { type: 'webserver',    icon: '🖥️', name: 'Web Server',      category: 'Compute',       color: '#6366F1', desc: 'Serves HTTP requests (NGINX)' },
  { type: 'appserver',    icon: '⚙️', name: 'App Server',      category: 'Compute',       color: '#8B5CF6', desc: 'Business logic processing' },
  { type: 'microservice', icon: '🔧', name: 'Microservice',    category: 'Compute',       color: '#06B6D4', desc: 'Isolated service component' },
  { type: 'docker',       icon: '🐳', name: 'Docker',          category: 'Compute',       color: '#0EA5E9', desc: 'Containerized service' },
  { type: 'kubernetes',   icon: '☸️', name: 'Kubernetes',      category: 'Compute',       color: '#326CE5', desc: 'Container orchestration' },
  { type: 'database',     icon: '🗄️', name: 'Database',        category: 'Storage',       color: '#EF4444', desc: 'Primary data store' },
  { type: 'replica',      icon: '📋', name: 'DB Replica',      category: 'Storage',       color: '#F97316', desc: 'Read replica / follower' },
  { type: 'cache',        icon: '⚡', name: 'Cache',           category: 'Storage',       color: '#EAB308', desc: 'In-memory caching (Redis)' },
  { type: 'storage',      icon: '🪣', name: 'Object Storage',  category: 'Storage',       color: '#84CC16', desc: 'S3-compatible blob storage' },
  { type: 'queue',        icon: '📨', name: 'Message Queue',   category: 'Messaging',     color: '#F59E0B', desc: 'Async message processing' },
  { type: 'kafka',        icon: '🌊', name: 'Kafka',           category: 'Messaging',     color: '#231F20', desc: 'Distributed event streaming' },
  { type: 'elasticsearch',icon: '🔍', name: 'ElasticSearch',   category: 'Data',          color: '#F9A825', desc: 'Full-text search engine' },
  { type: 'monitoring',   icon: '📊', name: 'Monitoring',      category: 'Observability', color: '#E85D04', desc: 'Metrics & alerting (Grafana)' },
  { type: 'auth',         icon: '🔐', name: 'Auth Service',    category: 'Security',      color: '#DC2626', desc: 'Authentication & authorization' },
  { type: 'external',     icon: '🌍', name: 'External API',    category: 'External',      color: '#64748B', desc: 'Third-party service' }
];

/* ── Architecture Templates ── */
const TEMPLATES = [
  { id: 't1',  name: 'Netflix',       icon: '🎬', category: 'Streaming',   difficulty: 'hard',   desc: 'Global video streaming with CDN, microservices, and chaos engineering.', tags: ['CDN','Microservices','Cassandra'], nodes: [{type:'client',x:80,y:200},{type:'cdn',x:260,y:100},{type:'loadbalancer',x:260,y:220},{type:'apigateway',x:440,y:220},{type:'microservice',x:620,y:120},{type:'microservice',x:620,y:220},{type:'microservice',x:620,y:320},{type:'database',x:800,y:170},{type:'cache',x:800,y:280},{type:'storage',x:800,y:380}], connections: [[0,1],[0,2],[2,3],[3,4],[3,5],[3,6],[4,7],[5,7],[5,8],[6,9]] },
  { id: 't2',  name: 'Uber',          icon: '🚗', category: 'Marketplace', difficulty: 'hard',   desc: 'Real-time ride matching with geospatial indexing and surge pricing.', tags: ['WebSocket','Geo','Kafka'], nodes: [{type:'mobile',x:80,y:200},{type:'apigateway',x:280,y:200},{type:'microservice',x:480,y:100},{type:'microservice',x:480,y:200},{type:'microservice',x:480,y:300},{type:'kafka',x:680,y:200},{type:'database',x:880,y:120},{type:'cache',x:880,y:250}], connections: [[0,1],[1,2],[1,3],[1,4],[3,5],[5,6],[5,7]] },
  { id: 't3',  name: 'WhatsApp',      icon: '💬', category: 'Messaging',   difficulty: 'hard',   desc: 'End-to-end encrypted messaging at 2 billion users scale.', tags: ['WebSocket','Sharding','E2E'], nodes: [{type:'mobile',x:80,y:200},{type:'loadbalancer',x:280,y:200},{type:'webserver',x:480,y:100},{type:'webserver',x:480,y:300},{type:'queue',x:680,y:200},{type:'database',x:880,y:200}], connections: [[0,1],[1,2],[1,3],[2,4],[3,4],[4,5]] },
  { id: 't4',  name: 'YouTube',       icon: '▶️', category: 'Streaming',   difficulty: 'hard',   desc: 'Video upload, transcoding, delivery and recommendations at scale.', tags: ['CDN','Transcoding','ML'], nodes: [{type:'client',x:80,y:200},{type:'cdn',x:280,y:100},{type:'apigateway',x:280,y:280},{type:'microservice',x:480,y:180},{type:'storage',x:680,y:100},{type:'database',x:680,y:280},{type:'cache',x:680,y:380}], connections: [[0,1],[0,2],[2,3],[3,4],[3,5],[3,6]] },
  { id: 't5',  name: 'Twitter/X',     icon: '🐦', category: 'Social',      difficulty: 'hard',   desc: 'Fan-out on write vs read for timeline delivery to millions of followers.', tags: ['Fan-out','Redis','Cassandra'], nodes: [{type:'client',x:80,y:200},{type:'loadbalancer',x:280,y:200},{type:'appserver',x:480,y:200},{type:'cache',x:680,y:120},{type:'database',x:680,y:240},{type:'queue',x:680,y:360}], connections: [[0,1],[1,2],[2,3],[2,4],[2,5]] },
  { id: 't6',  name: 'Instagram',     icon: '📸', category: 'Social',      difficulty: 'medium', desc: 'Photo/video sharing with CDN, feed generation and story expiry.', tags: ['CDN','Stories','Feed'], nodes: [{type:'mobile',x:80,y:200},{type:'cdn',x:280,y:120},{type:'apigateway',x:280,y:250},{type:'appserver',x:480,y:200},{type:'storage',x:680,y:120},{type:'database',x:680,y:280}], connections: [[0,1],[0,2],[2,3],[3,4],[3,5]] },
  { id: 't7',  name: 'Amazon',        icon: '📦', category: 'E-Commerce',  difficulty: 'hard',   desc: 'Catalog, cart, checkout, payments, fulfillment and recommendations.', tags: ['Microservices','SQS','DynamoDB'], nodes: [{type:'client',x:80,y:200},{type:'loadbalancer',x:260,y:200},{type:'apigateway',x:440,y:200},{type:'microservice',x:640,y:100},{type:'microservice',x:640,y:200},{type:'microservice',x:640,y:300},{type:'database',x:840,y:200}], connections: [[0,1],[1,2],[2,3],[2,4],[2,5],[3,6],[4,6],[5,6]] },
  { id: 't8',  name: 'Spotify',       icon: '🎵', category: 'Streaming',   difficulty: 'medium', desc: 'Music streaming with personalization, offline mode and social features.', tags: ['CDN','ML','GraphQL'], nodes: [{type:'mobile',x:80,y:200},{type:'cdn',x:280,y:120},{type:'apigateway',x:280,y:260},{type:'microservice',x:480,y:200},{type:'storage',x:680,y:120},{type:'database',x:680,y:280},{type:'cache',x:680,y:380}], connections: [[0,1],[0,2],[2,3],[3,4],[3,5],[3,6]] },
  { id: 't9',  name: 'Google Drive',  icon: '💾', category: 'Storage',     difficulty: 'medium', desc: 'Cloud storage with real-time collaboration, sync and conflict resolution.', tags: ['CRDT','WebSocket','GCS'], nodes: [{type:'client',x:80,y:200},{type:'apigateway',x:280,y:200},{type:'appserver',x:480,y:200},{type:'storage',x:680,y:120},{type:'database',x:680,y:280},{type:'cache',x:880,y:200}], connections: [[0,1],[1,2],[2,3],[2,4],[2,5]] },
  { id: 't10', name: 'Slack',         icon: '💼', category: 'Messaging',   difficulty: 'medium', desc: 'Team messaging with channels, threads, search and integrations.', tags: ['WebSocket','ElasticSearch','Redis'], nodes: [{type:'client',x:80,y:200},{type:'loadbalancer',x:280,y:200},{type:'webserver',x:480,y:200},{type:'queue',x:680,y:120},{type:'database',x:680,y:280},{type:'elasticsearch',x:880,y:200}], connections: [[0,1],[1,2],[2,3],[2,4],[2,5]] },
  { id: 't11', name: 'Stripe',        icon: '💳', category: 'Payments',    difficulty: 'hard',   desc: 'Payment processing with idempotency, webhooks and fraud detection.', tags: ['Idempotency','Events','Vault'], nodes: [{type:'client',x:80,y:200},{type:'apigateway',x:280,y:200},{type:'microservice',x:480,y:120},{type:'microservice',x:480,y:280},{type:'database',x:680,y:200},{type:'queue',x:680,y:340}], connections: [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5]] },
  { id: 't12', name: 'Discord',       icon: '🎮', category: 'Messaging',   difficulty: 'medium', desc: 'Voice, video and text for gaming communities with presence system.', tags: ['WebRTC','WebSocket','Cassandra'], nodes: [{type:'client',x:80,y:200},{type:'loadbalancer',x:280,y:200},{type:'appserver',x:480,y:120},{type:'appserver',x:480,y:280},{type:'database',x:680,y:200},{type:'cache',x:680,y:340}], connections: [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5]] },
  { id: 't13', name: 'LinkedIn',      icon: '👔', category: 'Social',      difficulty: 'medium', desc: 'Professional networking with feed, jobs and graph-based connections.', tags: ['Graph','Feed','Kafka'], nodes: [{type:'client',x:80,y:200},{type:'apigateway',x:280,y:200},{type:'microservice',x:480,y:160},{type:'microservice',x:480,y:280},{type:'database',x:680,y:200},{type:'elasticsearch',x:680,y:320}], connections: [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5]] },
  { id: 't14', name: 'Dropbox',       icon: '📁', category: 'Storage',     difficulty: 'easy',   desc: 'File sync with block-level deduplication and delta sync.', tags: ['Sync','Dedup','S3'], nodes: [{type:'client',x:80,y:200},{type:'apigateway',x:280,y:200},{type:'appserver',x:480,y:200},{type:'storage',x:680,y:120},{type:'database',x:680,y:280}], connections: [[0,1],[1,2],[2,3],[2,4]] },
  { id: 't15', name: 'Uber Eats',     icon: '🍔', category: 'Marketplace', difficulty: 'medium', desc: 'Food ordering with real-time tracking, restaurant catalog and payments.', tags: ['Geo','Real-time','Maps'], nodes: [{type:'mobile',x:80,y:200},{type:'apigateway',x:280,y:200},{type:'microservice',x:480,y:120},{type:'microservice',x:480,y:280},{type:'database',x:680,y:200},{type:'queue',x:680,y:320}], connections: [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5]] },
  { id: 't16', name: 'TikTok',        icon: '🎵', category: 'Social',      difficulty: 'hard',   desc: 'Short video platform with ML-powered personalized recommendation feed.', tags: ['ML','CDN','Recommendation'], nodes: [{type:'mobile',x:80,y:200},{type:'cdn',x:280,y:100},{type:'apigateway',x:280,y:280},{type:'microservice',x:480,y:200},{type:'storage',x:680,y:100},{type:'database',x:680,y:280},{type:'cache',x:680,y:380}], connections: [[0,1],[0,2],[2,3],[3,4],[3,5],[3,6]] },
  { id: 't17', name: 'PayPal',        icon: '💰', category: 'Payments',    difficulty: 'hard',   desc: 'Digital wallet with sender/receiver ledger and regulatory compliance.', tags: ['Ledger','Compliance','2FA'], nodes: [{type:'client',x:80,y:200},{type:'apigateway',x:280,y:200},{type:'auth',x:480,y:100},{type:'microservice',x:480,y:260},{type:'database',x:680,y:200},{type:'monitoring',x:680,y:340}], connections: [[0,1],[1,2],[1,3],[2,3],[3,4],[3,5]] },
  { id: 't18', name: 'Flipkart',      icon: '🛒', category: 'E-Commerce',  difficulty: 'medium', desc: 'Indian e-commerce platform with catalog, flash sales and delivery.', tags: ['Microservices','MySQL','Redis'], nodes: [{type:'client',x:80,y:200},{type:'loadbalancer',x:280,y:200},{type:'appserver',x:480,y:200},{type:'database',x:680,y:120},{type:'cache',x:680,y:280},{type:'queue',x:680,y:380}], connections: [[0,1],[1,2],[2,3],[2,4],[2,5]] },
  { id: 't19', name: 'Swiggy',        icon: '🛵', category: 'Marketplace', difficulty: 'easy',   desc: 'Food delivery with hyperlocal matching and real-time GPS tracking.', tags: ['Geo','WebSocket','Maps'], nodes: [{type:'mobile',x:80,y:200},{type:'apigateway',x:280,y:200},{type:'appserver',x:480,y:200},{type:'database',x:680,y:120},{type:'cache',x:680,y:280}], connections: [[0,1],[1,2],[2,3],[2,4]] },
  { id: 't20', name: 'Shopify',       icon: '🏪', category: 'E-Commerce',  difficulty: 'medium', desc: 'Multi-tenant e-commerce platform with checkout, inventory and analytics.', tags: ['Multi-tenant','GraphQL','Kafka'], nodes: [{type:'client',x:80,y:200},{type:'apigateway',x:280,y:200},{type:'microservice',x:480,y:160},{type:'microservice',x:480,y:280},{type:'database',x:680,y:200},{type:'cache',x:680,y:340}], connections: [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5]] }
];

/* ── Learning Topics ── */
const LEARNING_TOPICS = [
  { id: 'lb',   icon: '⚖️', name: 'Load Balancing',       content: { summary: 'Load balancing distributes incoming network traffic across multiple servers to ensure reliability and performance.', points: ['Round Robin: requests cycled equally across servers', 'Least Connections: send to server with fewest active connections', 'IP Hash: same client always hits same server (session affinity)', 'Health checks remove failed servers automatically', 'Layer 4 (TCP) vs Layer 7 (HTTP) load balancers'], analogy: 'Like a traffic officer directing cars to different toll booths based on queue length.', relatedTopics: ['Horizontal Scaling', 'Health Checks', 'Session Management'] } },
  { id: 'cache', icon: '⚡', name: 'Caching',              content: { summary: 'Caching stores frequently accessed data in faster storage to reduce latency and backend load.', points: ['Cache Hit: data found in cache, served instantly', 'Cache Miss: must fetch from database, then store in cache', 'TTL (Time To Live): how long cache entry stays valid', 'LRU (Least Recently Used): eviction policy for cache', 'Write-through vs Write-back vs Write-around strategies'], analogy: 'Like keeping your most-used kitchen tools on the counter instead of a cupboard.', relatedTopics: ['Redis', 'CDN', 'Database Optimization'] } },
  { id: 'db',   icon: '🗄️', name: 'Databases',            content: { summary: 'Choosing the right database type is critical: relational for structured data and ACID guarantees; NoSQL for scale and flexibility.', points: ['RDBMS: structured data, joins, ACID transactions (PostgreSQL, MySQL)', 'Document DB: flexible schema (MongoDB)', 'Key-Value: ultra-fast lookups (Redis, DynamoDB)', 'Time-series: metrics data (InfluxDB)', 'Graph DB: relationships (Neo4j)'], analogy: 'Like choosing the right filing system — folders (relational) vs labels (key-value) vs connections (graph).', relatedTopics: ['Sharding', 'Replication', 'CAP Theorem'] } },
  { id: 'rep',  icon: '🔄', name: 'Replication',           content: { summary: 'Replication copies data across multiple nodes for fault tolerance and read scalability.', points: ['Primary-Replica: one writer, multiple read replicas', 'Synchronous replication: waits for replica acknowledgment (strong consistency)', 'Asynchronous replication: faster writes, possible lag', 'Replication lag can cause stale reads', 'Multi-primary: all nodes can write (conflict resolution needed)'], analogy: 'Like keeping copies of important documents in multiple safes.', relatedTopics: ['CAP Theorem', 'Consistency', 'Failover'] } },
  { id: 'shard',icon: '🧩', name: 'Sharding',              content: { summary: 'Sharding partitions data across multiple databases to scale horizontally beyond a single machine.', points: ['Horizontal partitioning: different rows in different shards', 'Shard key determines which shard holds each record', 'Range sharding: partition by value range (A-M, N-Z)', 'Hash sharding: hash(key) % N determines shard', 'Directory sharding: lookup table maps keys to shards', 'Resharding is painful — plan shard key carefully'], analogy: 'Like splitting a library into wings alphabetically — Fiction A-M in wing 1, N-Z in wing 2.', relatedTopics: ['Consistent Hashing', 'Database Scaling', 'Replication'] } },
  { id: 'cap',  icon: '🔺', name: 'CAP Theorem',           content: { summary: 'In a distributed system, you can only guarantee two of three properties: Consistency, Availability, Partition Tolerance.', points: ['Consistency: all nodes see the same data at the same time', 'Availability: every request gets a response (not necessarily latest data)', 'Partition Tolerance: system works despite network splits', 'Network partitions are inevitable — choose C or A', 'CP systems: HBase, Zookeeper, MongoDB (strong consistency)', 'AP systems: DynamoDB, Cassandra, CouchDB (always available)'], analogy: 'Like a bank (consistency) vs a vending machine (availability) during a network outage.', relatedTopics: ['PACELC', 'Consistency Models', 'Distributed Systems'] } },
  { id: 'ms',   icon: '🔧', name: 'Microservices',         content: { summary: 'Microservices decompose an application into small, independently deployable services each owning its data.', points: ['Each service has a single responsibility', 'Services communicate via APIs (REST, gRPC) or events', 'Independent deployment and scaling per service', 'Service mesh handles discovery, auth, observability', 'Challenges: distributed tracing, eventual consistency, network latency', 'API Gateway as single entry point'], analogy: 'Like a restaurant with specialized chefs (pasta, grill, dessert) vs one chef doing everything.', relatedTopics: ['API Gateway', 'Service Mesh', 'Event-Driven Architecture'] } },
  { id: 'mq',   icon: '📨', name: 'Message Queues',        content: { summary: 'Message queues decouple producers from consumers, enabling async processing and absorbing traffic spikes.', points: ['Producer publishes messages without waiting for consumer', 'Consumer pulls messages at its own pace', 'Dead letter queue holds failed messages for retry', 'Fan-out: one message delivered to multiple queues', 'Kafka: high throughput log-based (retain messages)', 'RabbitMQ: traditional broker (delete after consumption)'], analogy: 'Like a restaurant ticket system — waiters post orders, kitchen processes at their pace.', relatedTopics: ['Kafka', 'Event-Driven Architecture', 'Backpressure'] } },
  { id: 'scale',icon: '📈', name: 'Scalability',           content: { summary: 'Scalability is the ability to handle growing load by adding resources, either vertically or horizontally.', points: ['Vertical scaling: bigger machine (faster CPUs, more RAM)', 'Horizontal scaling: more machines (preferred for large scale)', 'Stateless services scale horizontally easily', 'Stateful services require sticky sessions or external state', 'Auto-scaling: add/remove instances based on metrics', 'Database is usually the bottleneck — scale carefully'], analogy: 'Like expanding a restaurant: bigger kitchen (vertical) vs opening more branches (horizontal).', relatedTopics: ['Load Balancing', 'Auto-Scaling', 'Stateless Design'] } },
  { id: 'avail',icon: '🔁', name: 'Availability',          content: { summary: 'High availability means the system remains operational even when components fail.', points: ['Availability = uptime / total time × 100%', 'Five nines (99.999%) = ~5 min downtime per year', 'Eliminate single points of failure with redundancy', 'Active-active: both nodes serve traffic', 'Active-passive: standby takes over on failure', 'Circuit breaker pattern prevents cascade failures'], analogy: 'Like a hospital with backup generators — always operational regardless of power grid.', relatedTopics: ['Fault Tolerance', 'Circuit Breaker', 'SLA/SLO'] } },
  { id: 'fault',icon: '🛡️', name: 'Fault Tolerance',       content: { summary: 'Fault tolerance enables a system to continue operating correctly even when some components fail.', points: ['Retry with exponential backoff for transient failures', 'Circuit breaker: stop calling failing services', 'Bulkhead: isolate failures so they don\'t cascade', 'Timeout: don\'t wait forever for slow dependencies', 'Fallback: serve cached/default data on failure', 'Chaos engineering: deliberately inject failures to test resilience'], analogy: 'Like an aircraft with redundant engines — loss of one doesn\'t bring down the plane.', relatedTopics: ['Circuit Breaker', 'Retry Patterns', 'Chaos Engineering'] } },
  { id: 'eda',  icon: '⚡', name: 'Event-Driven Architecture', content: { summary: 'EDA decouples services through events, enabling reactive systems that respond to state changes asynchronously.', points: ['Events are immutable facts: "Order Placed", "Payment Received"', 'Event sourcing: store all events, rebuild state by replaying', 'CQRS: separate read (query) and write (command) models', 'Eventual consistency is the trade-off', 'Kafka enables durable, replayable event streams', 'Event-driven enables time-travel debugging'], analogy: 'Like a newspaper: publishers write stories, subscribers read when ready — no direct coupling.', relatedTopics: ['Kafka', 'CQRS', 'Event Sourcing'] } },
  { id: 'cqrs', icon: '✂️', name: 'CQRS & Event Sourcing',  content: { summary: 'CQRS separates reads and writes. Event sourcing stores the full history of state changes rather than current state.', points: ['Commands modify state, Queries read state', 'Read model optimized for queries (denormalized)', 'Write model enforces business rules', 'Event store is append-only log of all changes', 'Rebuild read model by replaying events', 'Enables temporal queries and audit log for free'], analogy: 'Like accounting ledgers: record every transaction (event sourcing), compute balance on demand (CQRS).', relatedTopics: ['Event-Driven Architecture', 'Eventual Consistency', 'Domain-Driven Design'] } },
  { id: 'cons', icon: '🎯', name: 'Consistent Hashing',     content: { summary: 'Consistent hashing minimizes data movement when nodes are added or removed from a distributed system.', points: ['Hash ring: nodes and keys placed on circular space', 'Key maps to next node clockwise on ring', 'Add node: only neighboring keys move', 'Remove node: only that node\'s keys reassign', 'Virtual nodes improve distribution and balance', 'Used by: DynamoDB, Cassandra, memcached'], analogy: 'Like assigning seats in a circular theatre — removing one seat only affects nearby audience members.', relatedTopics: ['Sharding', 'Load Balancing', 'Distributed Hash Tables'] } },
  { id: 'cdn2', icon: '🌐', name: 'CDN & Edge Computing',   content: { summary: 'CDNs cache content at edge servers close to users, reducing latency and origin server load.', points: ['Edge servers cache static and dynamic content', 'Cache invalidation: push vs pull strategies', 'Geographic routing sends user to nearest PoP', 'Edge computing runs logic at the CDN edge', 'Reduces latency from 200ms to <10ms for cached content', 'Used for: images, videos, CSS/JS, API responses'], analogy: 'Like Amazon warehouses near cities: faster delivery than shipping from one central warehouse.', relatedTopics: ['Caching', 'Latency', 'Geographic Distribution'] } },
  { id: 'sec',  icon: '🔐', name: 'Security Architecture',   content: { summary: 'Security must be layered across every tier: network, application, data, and identity.', points: ['JWT: stateless tokens with expiry and signature', 'OAuth 2.0: delegated authorization framework', 'mTLS: mutual TLS for service-to-service authentication', 'WAF: blocks malicious HTTP traffic at edge', 'Rate limiting: prevents abuse and DDoS', 'Secret management: HashiCorp Vault, AWS Secrets Manager'], analogy: 'Like a bank with security guards, card readers, cameras, and locked vaults — defense in depth.', relatedTopics: ['OAuth', 'Zero Trust', 'API Security'] } }
];

/* ── Comparisons ── */
const COMPARISONS = [
  { id: 'c1', title: 'Monolith vs Microservices', left: { name: 'Monolith', sub: 'Single deployable unit', color: '#6366F1' }, right: { name: 'Microservices', sub: 'Independent services', color: '#8B5CF6' }, desc: 'The fundamental architectural choice that shapes everything else.', features: [ { label: 'Deployment', leftVal: 'Simple, single deploy', rightVal: 'Complex, per-service CI/CD', leftScore: 85, rightScore: 45 }, { label: 'Scalability', leftVal: 'Scale entire app', rightVal: 'Scale per service', leftScore: 45, rightScore: 90 }, { label: 'Complexity', leftVal: 'Low (one codebase)', rightVal: 'High (distributed)', leftScore: 85, rightScore: 35 }, { label: 'Fault Isolation', leftVal: 'One failure = all down', rightVal: 'Isolated failures', leftScore: 30, rightScore: 90 }, { label: 'Team Autonomy', leftVal: 'Shared codebase', rightVal: 'Independent teams', leftScore: 40, rightScore: 95 } ] },
  { id: 'c2', title: 'SQL vs NoSQL', left: { name: 'SQL', sub: 'Relational databases', color: '#EF4444' }, right: { name: 'NoSQL', sub: 'Non-relational stores', color: '#F59E0B' }, desc: 'Choosing the right data model for your access patterns.', features: [ { label: 'Schema', leftVal: 'Rigid, predefined', rightVal: 'Flexible, dynamic', leftScore: 40, rightScore: 90 }, { label: 'ACID', leftVal: 'Full ACID support', rightVal: 'Eventual consistency', leftScore: 95, rightScore: 40 }, { label: 'Horizontal Scale', leftVal: 'Difficult (sharding)', rightVal: 'Built-in', leftScore: 35, rightScore: 90 }, { label: 'Query Flexibility', leftVal: 'Rich joins & aggregations', rightVal: 'Limited joins', leftScore: 95, rightScore: 45 }, { label: 'Use Case Fit', leftVal: 'Financial, transactional', rightVal: 'High-scale, unstructured', leftScore: 90, rightScore: 80 } ] },
  { id: 'c3', title: 'REST vs GraphQL', left: { name: 'REST', sub: 'Resource-based API', color: '#10B981' }, right: { name: 'GraphQL', sub: 'Query language API', color: '#06B6D4' }, desc: 'API design patterns with different trade-offs.', features: [ { label: 'Overfetching', leftVal: 'Common problem', rightVal: 'Eliminated', leftScore: 40, rightScore: 95 }, { label: 'Caching', leftVal: 'Easy (URL-based)', rightVal: 'Complex (POST-based)', leftScore: 90, rightScore: 35 }, { label: 'Learning Curve', leftVal: 'Simple & familiar', rightVal: 'Schema + resolvers', leftScore: 90, rightScore: 55 }, { label: 'Flexibility', leftVal: 'Fixed endpoints', rightVal: 'Exact data fetching', leftScore: 45, rightScore: 95 }, { label: 'Tooling', leftVal: 'Mature ecosystem', rightVal: 'Growing ecosystem', leftScore: 85, rightScore: 70 } ] },
  { id: 'c4', title: 'Redis vs Memcached', left: { name: 'Redis', sub: 'Advanced data structures', color: '#EF4444' }, right: { name: 'Memcached', sub: 'Simple key-value', color: '#64748B' }, desc: 'Choosing the right in-memory caching solution.', features: [ { label: 'Data Types', leftVal: 'String, List, Set, Hash, ZSet', rightVal: 'String only', leftScore: 95, rightScore: 40 }, { label: 'Persistence', leftVal: 'RDB + AOF', rightVal: 'No persistence', leftScore: 90, rightScore: 10 }, { label: 'Performance', leftVal: 'Very fast', rightVal: 'Ultra fast (simpler)', leftScore: 80, rightScore: 90 }, { label: 'Clustering', leftVal: 'Redis Cluster built-in', rightVal: 'Client-side sharding', leftScore: 85, rightScore: 50 }, { label: 'Features', leftVal: 'Pub/Sub, Lua, Streams', rightVal: 'Simple get/set', leftScore: 95, rightScore: 30 } ] },
  { id: 'c5', title: 'Kafka vs RabbitMQ', left: { name: 'Kafka', sub: 'Distributed log', color: '#231F20' }, right: { name: 'RabbitMQ', sub: 'Message broker', color: '#F97316' }, desc: 'Event streaming vs traditional message queuing.', features: [ { label: 'Throughput', leftVal: 'Millions/sec', rightVal: 'Thousands/sec', leftScore: 99, rightScore: 60 }, { label: 'Message Retention', leftVal: 'Configurable (days/months)', rightVal: 'Deleted after consumption', leftScore: 95, rightScore: 20 }, { label: 'Complexity', leftVal: 'High (brokers, partitions)', rightVal: 'Lower, simpler setup', leftScore: 30, rightScore: 75 }, { label: 'Push/Pull', leftVal: 'Pull-based consumers', rightVal: 'Push-based delivery', leftScore: 70, rightScore: 85 }, { label: 'Use Case', leftVal: 'Event streaming, logs', rightVal: 'Task queues, RPC', leftScore: 90, rightScore: 85 } ] },
  { id: 'c6', title: 'Horizontal vs Vertical Scaling', left: { name: 'Horizontal', sub: 'Add more servers', color: '#6366F1' }, right: { name: 'Vertical', sub: 'Bigger server', color: '#8B5CF6' }, desc: 'Two fundamental approaches to scaling system capacity.', features: [ { label: 'Cost', leftVal: 'Linear, commodity hw', rightVal: 'Exponential cost curve', leftScore: 80, rightScore: 40 }, { label: 'Limit', leftVal: 'No theoretical limit', rightVal: 'Hardware ceiling', leftScore: 99, rightScore: 50 }, { label: 'Complexity', leftVal: 'Distributed system challenges', rightVal: 'Simple, no code change', leftScore: 30, rightScore: 90 }, { label: 'Downtime', leftVal: 'Zero downtime (rolling)', rightVal: 'Restart required', leftScore: 95, rightScore: 30 }, { label: 'Failure Impact', leftVal: 'One node goes down', rightVal: 'Total failure', leftScore: 90, rightScore: 20 } ] },
  { id: 'c7', title: 'Sync vs Async Communication', left: { name: 'Synchronous', sub: 'Request-Response', color: '#10B981' }, right: { name: 'Asynchronous', sub: 'Event-based', color: '#F59E0B' }, desc: 'How services talk to each other shapes latency and resilience.', features: [ { label: 'Simplicity', leftVal: 'Easy to reason about', rightVal: 'Eventual consistency', leftScore: 90, rightScore: 40 }, { label: 'Coupling', leftVal: 'Tight coupling', rightVal: 'Loose coupling', leftScore: 30, rightScore: 90 }, { label: 'Latency', leftVal: 'Immediate response', rightVal: 'Delayed processing', leftScore: 85, rightScore: 50 }, { label: 'Resilience', leftVal: 'Fails if dependency down', rightVal: 'Survives failures', leftScore: 30, rightScore: 90 }, { label: 'Throughput', leftVal: 'Blocked waiting', rightVal: 'High throughput', leftScore: 40, rightScore: 95 } ] }
];

/* ── Interview Challenges ── */
const INTERVIEW_CHALLENGES = [
  { id: 'i1', icon: '▶️', name: 'Design YouTube', company: 'Google', difficulty: 'hard', time: 45, desc: 'Design a video streaming platform serving 2B users with upload, transcoding, and personalized feeds.', requirements: ['Handle 500 hours of video uploaded per minute', 'Support 4K video streaming globally', 'Implement video transcoding pipeline', 'Design recommendation system', 'Handle 1B+ daily active users'], evaluation: ['Scalability', 'CDN usage', 'Database choice', 'Video processing pipeline', 'Search & recommendations'] },
  { id: 'i2', icon: '🚗', name: 'Design Uber', company: 'Uber', difficulty: 'hard', time: 45, desc: 'Design a real-time ride-sharing platform with matching, GPS tracking and surge pricing.', requirements: ['Match drivers and riders in <1 second', 'Handle real-time GPS updates from millions of drivers', 'Implement surge pricing algorithm', 'Support global scale with regional deployments', 'Handle payment processing'], evaluation: ['Geospatial indexing', 'WebSocket usage', 'Matching algorithm', 'Database for locations', 'Consistency vs availability'] },
  { id: 'i3', icon: '💬', name: 'Design WhatsApp', company: 'Meta', difficulty: 'hard', time: 45, desc: 'Design an end-to-end encrypted messaging system for 2 billion users.', requirements: ['Deliver messages with <100ms latency', 'Support 100B messages per day', 'End-to-end encryption', 'Handle offline message delivery', 'Group chats up to 1024 members'], evaluation: ['E2E encryption design', 'Message storage', 'Online presence', 'Push notifications', 'Consistency model'] },
  { id: 'i4', icon: '💾', name: 'Design Google Drive', company: 'Google', difficulty: 'medium', time: 35, desc: 'Design a cloud storage platform with real-time collaboration and sync.', requirements: ['Handle file uploads up to 5TB', 'Real-time collaboration on documents', 'Sync across multiple devices', 'File versioning and history', 'Share with permissions'], evaluation: ['Block-level sync', 'Conflict resolution', 'Storage efficiency', 'Permission model', 'Metadata management'] },
  { id: 'i5', icon: '🐦', name: 'Design Twitter', company: 'Twitter/X', difficulty: 'hard', time: 45, desc: 'Design a microblogging platform with 500M users and real-time timeline delivery.', requirements: ['Handle 500M tweets per day', 'Timeline delivery with fan-out', 'Handle celebrity accounts (100M followers)', 'Real-time trending topics', 'Search across all tweets'], evaluation: ['Fan-out strategy', 'Timeline generation', 'Celebrity problem', 'Search architecture', 'Data storage at scale'] },
  { id: 'i6', icon: '🔍', name: 'Design Google Search', company: 'Google', difficulty: 'hard', time: 60, desc: 'Design a web search engine that crawls, indexes and ranks billions of web pages.', requirements: ['Crawl 10B+ web pages', 'Index and rank content relevantly', 'Return results in <200ms', 'Handle 8B+ searches per day', 'Detect spam and low-quality pages'], evaluation: ['Crawler design', 'Inverted index', 'PageRank', 'Distributed storage', 'Query processing pipeline'] }
];

/* ── Achievements ── */
const ACHIEVEMENTS = [
  { id: 'first_build',    icon: '🏗️', name: 'First Blueprint',   desc: 'Create your first architecture' },
  { id: 'first_sim',      icon: '▶️', name: 'Simulator',         desc: 'Run your first simulation' },
  { id: 'template_load',  icon: '📐', name: 'Template Explorer', desc: 'Load a template' },
  { id: 'learner',        icon: '📚', name: 'Knowledge Seeker',  desc: 'Complete a learning topic' },
  { id: 'interviewer',    icon: '🎯', name: 'Interview Ready',   desc: 'Complete an interview challenge' },
  { id: 'xp_500',         icon: '⚡', name: 'XP Milestone',      desc: 'Earn 500 XP' },
  { id: 'xp_2000',        icon: '🌟', name: 'XP Master',         desc: 'Earn 2000 XP' },
  { id: 'builder_5',      icon: '🏙️', name: 'City Planner',      desc: 'Create 5 architectures' },
  { id: 'compare',        icon: '⚖️', name: 'Trade-off Analyst',  desc: 'View a comparison' },
  { id: 'whiteboard',     icon: '✏️', name: 'Visual Thinker',    desc: 'Use the whiteboard' },
  { id: 'streak_3',       icon: '🔥', name: 'On Fire',           desc: '3-day learning streak' },
  { id: 'all_topics',     icon: '🎓', name: 'System Architect',  desc: 'Complete all learning topics' }
];

/* ═══════════════════════════════════════════════
   04. UTILITIES
═══════════════════════════════════════════════ */
function el(id) { return document.getElementById(id); }
function qs(sel, parent = document) { return parent.querySelector(sel); }
function qsa(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }
function escHtml(s) { const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
function isTypingTarget(t) { if (!t) return false; return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable; }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function fmtDate(ts) { return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

const Toast = {
  container: null,
  init() { this.container = el('toastContainer'); },
  show(type, msg, duration = 3200) {
    if (!this.container) return;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-text"></span>`;
    t.querySelector('.toast-text').textContent = msg;
    this.container.appendChild(t);
    setTimeout(() => { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 280); }, duration);
  }
};

const Modal = {
  _resolve: null,
  init() {
    el('modalCancelBtn').addEventListener('click', () => this._close(false));
    el('modalConfirmBtn').addEventListener('click', () => this._close(true));
    el('modalOverlay').addEventListener('click', e => { if (e.target === el('modalOverlay')) this._close(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && el('modalOverlay').classList.contains('is-open')) this._close(false); });
  },
  open(title, body, confirmLabel = 'Confirm') {
    el('modalTitle').textContent = title;
    el('modalBodyText').textContent = body;
    el('modalConfirmBtn').textContent = confirmLabel;
    el('modalOverlay').classList.add('is-open');
    return new Promise(r => { this._resolve = r; });
  },
  _close(v) { el('modalOverlay').classList.remove('is-open'); if (this._resolve) { this._resolve(v); this._resolve = null; } }
};

function animNum(el, target, suffix = '', dur = 700) {
  if (!el) return;
  const start = parseFloat(el.dataset.cur || '0') || 0;
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * e) + suffix;
    if (p < 1) requestAnimationFrame(tick); else el.dataset.cur = String(target);
  };
  requestAnimationFrame(tick);
}

/* Simple canvas chart renderer */
const Charts = {
  _isDark() { return document.documentElement.getAttribute('data-theme') !== 'light'; },
  _textColor() { return this._isDark() ? '#9BA3B8' : '#4B5263'; },
  _gridColor() { return this._isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; },

  bar(canvas, labels, data, colors) {
    if (!canvas) return;
    const W = canvas.clientWidth || 400, H = canvas.clientHeight || 220;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 40, r: 14, t: 14, b: 34 };
    const max = Math.max(...data, 1);
    const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
    const bw = (gw / labels.length) * 0.6;
    const gap = gw / labels.length;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + gh * (1 - i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y);
      ctx.strokeStyle = this._gridColor(); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = this._textColor(); ctx.font = '10px Inter'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(max * i / 4), pad.l - 4, y + 3);
    }
    data.forEach((v, i) => {
      const x = pad.l + gap * i + (gap - bw) / 2;
      const bh = gh * (v / max);
      const y = pad.t + gh - bh;
      const c = Array.isArray(colors) ? colors[i % colors.length] : colors;
      ctx.beginPath();
      const r = Math.min(4, bh / 2);
      ctx.moveTo(x + r, y); ctx.lineTo(x + bw - r, y);
      ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
      ctx.lineTo(x + bw, y + bh); ctx.lineTo(x, y + bh); ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath(); ctx.fillStyle = c; ctx.fill();
      ctx.fillStyle = this._textColor(); ctx.font = '10px Inter'; ctx.textAlign = 'center';
      ctx.fillText(labels[i].slice(0, 8), x + bw / 2, H - pad.b + 14);
    });
  },

  line(canvas, labels, datasets) {
    if (!canvas) return;
    const W = canvas.clientWidth || 400, H = canvas.clientHeight || 220;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const allVals = datasets.flatMap(d => d.data);
    const max = Math.max(...allVals, 1);
    const pad = { l: 40, r: 14, t: 14, b: 34 };
    const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + gh * (1 - i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y);
      ctx.strokeStyle = this._gridColor(); ctx.lineWidth = 1; ctx.stroke();
    }
    const xStep = gw / Math.max(labels.length - 1, 1);
    labels.forEach((l, i) => {
      if (i % Math.ceil(labels.length / 7) === 0) {
        ctx.fillStyle = this._textColor(); ctx.font = '10px Inter'; ctx.textAlign = 'center';
        ctx.fillText(l, pad.l + i * xStep, H - pad.b + 14);
      }
    });
    datasets.forEach(ds => {
      ctx.beginPath();
      ds.data.forEach((v, i) => {
        const x = pad.l + i * xStep, y = pad.t + gh * (1 - v / max);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = ds.color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.lineTo(pad.l + (ds.data.length - 1) * xStep, H - pad.b);
      ctx.lineTo(pad.l, H - pad.b); ctx.closePath();
      ctx.fillStyle = ds.color + '18'; ctx.fill();
    });
  },

  pie(canvas, labels, data, colors) {
    if (!canvas) return;
    const W = canvas.clientWidth || 300, H = canvas.clientHeight || 220;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const total = data.reduce((a, b) => a + b, 0) || 1;
    const cx = W / 2, cy = (H - 30) / 2, r = Math.min(cx, cy) - 16;
    let angle = -Math.PI / 2;
    data.forEach((v, i) => {
      const slice = (v / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath(); ctx.fillStyle = colors[i % colors.length]; ctx.fill();
      angle += slice;
    });
    labels.forEach((l, i) => {
      const lx = (i % 4) * (W / 4) + 6, ly = H - 22 + Math.floor(i / 4) * 14;
      ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(lx, ly, 8, 8);
      ctx.fillStyle = this._textColor(); ctx.font = '10px Inter'; ctx.textAlign = 'left';
      ctx.fillText(l.slice(0, 9), lx + 11, ly + 8);
    });
  }
};

/* ═══════════════════════════════════════════════
   05. THEME SYSTEM
═══════════════════════════════════════════════ */
const ThemeSystem = {
  mq: window.matchMedia('(prefers-color-scheme: dark)'),
  init() {
    this._apply(STATE.theme);
    this.mq.addEventListener('change', () => { if (STATE.theme === 'auto') this._applyResolved(); });
    el('themeBtn').addEventListener('click', () => {
      const resolved = this._resolved();
      this.set(resolved === 'dark' ? 'light' : 'dark');
    });
  },
  _resolved() {
    if (STATE.theme === 'auto') return this.mq.matches ? 'dark' : 'light';
    return STATE.theme || 'dark';
  },
  _applyResolved() {
    const r = this._resolved();
    document.documentElement.setAttribute('data-theme', r);
    const sun = el('themeSunIcon'), moon = el('themeMoonIcon');
    if (sun) sun.style.display = r === 'dark' ? 'none' : 'block';
    if (moon) moon.style.display = r === 'dark' ? 'block' : 'none';
  },
  _apply(theme) { STATE.theme = theme; this._applyResolved(); this._syncPills(); },
  set(theme) { this._apply(theme); saveState(); },
  _syncPills() { qsa('.theme-pill').forEach(p => p.classList.toggle('is-active', p.dataset.theme === STATE.theme)); }
};

/* ═══════════════════════════════════════════════
   06. SPLASH & BOOT
═══════════════════════════════════════════════ */
function runSplash(cb) {
  const msgs = ['Loading component library…', 'Initializing simulators…', 'Building templates…', 'Ready to architect!'];
  let i = 0;
  const iv = setInterval(() => { if (++i < msgs.length) el('splashStatus').textContent = msgs[i]; }, 300);
  setTimeout(() => {
    clearInterval(iv);
    el('splashScreen').classList.add('is-gone');
    el('appShell').style.display = 'flex';
    setTimeout(cb, 50);
  }, 1250);
}

/* ═══════════════════════════════════════════════
   07. ROUTER / NAVIGATION
═══════════════════════════════════════════════ */
const Router = {
  current: 'dashboard',
  _renders: {}, // populated in init after all modules defined
  init() {
    this._renders = {
      dashboard:  () => DashboardModule.render(),
      builder:    () => BuilderModule.render(),
      simulator:  () => SimulatorModule.render(),
      traffic:    () => TrafficModule.render(),
      failures:   () => FailureModule.render(),
      templates:  () => TemplatesModule.render(),
      whiteboard: () => WhiteboardModule.render(),
      learning:   () => LearningModule.render(),
      interview:  () => InterviewModule.render(),
      comparison: () => ComparisonModule.render(),
      analytics:  () => AnalyticsModule.render(),
      projects:   () => ProjectsModule.render(),
      settings:   () => SettingsModule.render()
    };
    // Event delegation — catches all [data-view] clicks
    document.addEventListener('click', e => {
      const target = e.target.closest('[data-view]');
      if (target) { e.preventDefault(); this.go(target.dataset.view); }
    });
  },
  go(route) {
    if (!route) return;
    const view = el(`view-${route}`);
    if (!view) { Toast.show('info', 'View not found.'); return; }
    qsa('.view').forEach(v => v.classList.remove('active'));
    view.classList.add('active');
    qsa('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === route));
    this.current = route;
    CmdPalette.close();
    GlobalSearch.close();
    closeMobileNav();
    if (this._renders[route]) this._renders[route]();
  }
};

/* ═══════════════════════════════════════════════
   08. SIDEBAR & TOPBAR
═══════════════════════════════════════════════ */
function initSidebar() {
  el('sidebarCollapseBtn').addEventListener('click', () => {
    el('appShell').classList.toggle('collapsed');
    Store.set('sidebarCollapsed', el('appShell').classList.contains('collapsed'));
  });
  if (Store.get('sidebarCollapsed', false)) el('appShell').classList.add('collapsed');
  el('hamburgerBtn').addEventListener('click', () => el('appShell').classList.toggle('nav-open'));
  el('sidebarMobileBackdrop').addEventListener('click', closeMobileNav);
}
function closeMobileNav() { el('appShell').classList.remove('nav-open'); }

function updateTopbarCounters() {
  el('sidebarXPValue').textContent = STATE.xp.toLocaleString();
  el('streakVal').textContent = STATE.streak;
  el('sssProjects').textContent = (STATE.projects || []).length;
  el('sssSimulations').textContent = (STATE.simulations || []).length;
  el('projectsBadge').textContent = (STATE.projects || []).length;
}

function initTopbar() {
  el('topbarSearchWrap').addEventListener('click', () => GlobalSearch.open());
  el('topbarSearchInput').addEventListener('click', () => GlobalSearch.open());
  el('newProjectBtn').addEventListener('click', () => { BuilderModule.newProject(); Router.go('builder'); });
  el('notifBtn').addEventListener('click', e => {
    e.stopPropagation();
    el('notifDrawer').classList.toggle('is-open');
    if (el('notifDrawer').classList.contains('is-open')) NotifModule.render();
  });
  document.addEventListener('click', e => {
    if (!el('notifDrawer').contains(e.target) && e.target !== el('notifBtn')) {
      el('notifDrawer').classList.remove('is-open');
    }
  });
  el('clearNotifsBtn').addEventListener('click', () => {
    STATE.notifications = []; saveState(); NotifModule.render();
    el('notifDot').style.display = 'none';
  });
  updateTopbarCounters();
}

/* ═══════════════════════════════════════════════
   09. COMMAND PALETTE
═══════════════════════════════════════════════ */
const CMD_ITEMS = [
  { icon: '⌂',  title: 'Dashboard',          sub: 'Overview and stats',            action: () => Router.go('dashboard') },
  { icon: '🏗️', title: 'Architecture Builder',sub: 'Drag-drop designer',            action: () => Router.go('builder') },
  { icon: '▶️', title: 'Simulators',          sub: 'Run system simulations',        action: () => Router.go('simulator') },
  { icon: '📊', title: 'Traffic Generator',   sub: 'Simulate load patterns',        action: () => Router.go('traffic') },
  { icon: '💥', title: 'Failure Simulator',   sub: 'Inject and observe failures',   action: () => Router.go('failures') },
  { icon: '📐', title: 'Templates',           sub: '20 real-world architectures',   action: () => Router.go('templates') },
  { icon: '✏️', title: 'Whiteboard',          sub: 'Freehand sketching',            action: () => Router.go('whiteboard') },
  { icon: '📚', title: 'Learning Hub',        sub: 'Distributed systems concepts',  action: () => Router.go('learning') },
  { icon: '🎯', title: 'Interview Mode',      sub: 'System design challenges',      action: () => Router.go('interview') },
  { icon: '⚖️', title: 'Comparisons',         sub: 'Architectural trade-offs',      action: () => Router.go('comparison') },
  { icon: '📈', title: 'Analytics',           sub: 'Performance metrics',           action: () => Router.go('analytics') },
  { icon: '📁', title: 'Projects',            sub: 'Manage saved designs',          action: () => Router.go('projects') },
  { icon: '⚙️', title: 'Settings',            sub: 'Platform preferences',          action: () => Router.go('settings') },
  { icon: '🌗', title: 'Toggle Theme',        sub: 'Switch light / dark mode',      action: () => { const r = ThemeSystem._resolved(); ThemeSystem.set(r === 'dark' ? 'light' : 'dark'); } },
  { icon: '➕', title: 'New Architecture',    sub: 'Start a new design',            action: () => { BuilderModule.newProject(); Router.go('builder'); } }
];

const CmdPalette = {
  focused: -1, currentItems: [],
  init() {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        if (el('appShell').style.display !== 'none') { e.preventDefault(); this.toggle(); }
      }
      if (e.key === 'Escape') { this.close(); GlobalSearch.close(); }
      if (el('cmdOverlay').classList.contains('is-open')) {
        if (e.key === 'ArrowDown') { e.preventDefault(); this._moveFocus(1); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); this._moveFocus(-1); }
        if (e.key === 'Enter')     { this._selectFocused(); }
      }
    });
    el('cmdOverlay').addEventListener('click', e => { if (e.target === el('cmdOverlay')) this.close(); });
    el('cmdInput').addEventListener('input', () => this._filter(el('cmdInput').value));
  },
  toggle() { el('cmdOverlay').classList.contains('is-open') ? this.close() : this.open(); },
  open() {
    el('cmdOverlay').classList.add('is-open');
    el('cmdInput').value = ''; this.focused = -1;
    this._render(CMD_ITEMS);
    setTimeout(() => el('cmdInput').focus(), 40);
  },
  close() { el('cmdOverlay').classList.remove('is-open'); },
  _filter(q) {
    const lower = q.toLowerCase();
    const filtered = CMD_ITEMS.filter(i => i.title.toLowerCase().includes(lower) || i.sub.toLowerCase().includes(lower));
    const tplMatches = q.length >= 2 ? TEMPLATES.filter(t => t.name.toLowerCase().includes(lower)).slice(0, 4) : [];
    const topicMatches = q.length >= 2 ? LEARNING_TOPICS.filter(t => t.name.toLowerCase().includes(lower)).slice(0, 3) : [];
    this._render(filtered, tplMatches, topicMatches); this.focused = -1;
  },
  _render(items, templates = [], topics = []) {
    this.currentItems = items;
    let html = '';
    if (items.length) {
      html += '<div class="cmd-group-title">Actions & Navigation</div>';
      html += items.map((item, i) =>
        `<div class="cmd-result-item" data-idx="${i}" tabindex="-1">
          <div class="cmd-result-icon">${item.icon}</div>
          <div class="cmd-result-text"><div class="cmd-result-title">${escHtml(item.title)}</div><div class="cmd-result-sub">${escHtml(item.sub)}</div></div>
        </div>`
      ).join('');
    }
    if (templates.length) {
      html += '<div class="cmd-group-title">Templates</div>';
      html += templates.map(t =>
        `<div class="cmd-result-item" data-tpl="${escHtml(t.id)}" tabindex="-1">
          <div class="cmd-result-icon">${t.icon}</div>
          <div class="cmd-result-text"><div class="cmd-result-title">${escHtml(t.name)}</div><div class="cmd-result-sub">${escHtml(t.desc.slice(0, 55))}…</div></div>
        </div>`
      ).join('');
    }
    if (topics.length) {
      html += '<div class="cmd-group-title">Learning Topics</div>';
      html += topics.map(t =>
        `<div class="cmd-result-item" data-topic="${escHtml(t.id)}" tabindex="-1">
          <div class="cmd-result-icon">${t.icon}</div>
          <div class="cmd-result-text"><div class="cmd-result-title">${escHtml(t.name)}</div><div class="cmd-result-sub">Learning Hub</div></div>
        </div>`
      ).join('');
    }
    if (!html) html = '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px">No results found.</div>';
    el('cmdResults').innerHTML = html;
    // Wire click handlers using closure over item objects (not index)
    qsa('.cmd-result-item[data-idx]', el('cmdResults')).forEach((el2, i) => {
      const item = items[i];
      el2.addEventListener('click', () => { if (item?.action) item.action(); this.close(); });
    });
    qsa('.cmd-result-item[data-tpl]', el('cmdResults')).forEach(el2 => {
      el2.addEventListener('click', () => { TemplatesModule.loadTemplate(el2.dataset.tpl); this.close(); });
    });
    qsa('.cmd-result-item[data-topic]', el('cmdResults')).forEach(el2 => {
      el2.addEventListener('click', () => { Router.go('learning'); setTimeout(() => LearningModule.openTopic(el2.dataset.topic), 200); this.close(); });
    });
  },
  _moveFocus(dir) {
    const items = qsa('.cmd-result-item', el('cmdResults'));
    this.focused = clamp(this.focused + dir, 0, items.length - 1);
    items.forEach((it, i) => it.classList.toggle('is-focused', i === this.focused));
    if (items[this.focused]) items[this.focused].scrollIntoView({ block: 'nearest' });
  },
  _selectFocused() {
    const items = qsa('.cmd-result-item', el('cmdResults'));
    if (this.focused >= 0 && items[this.focused]) items[this.focused].click();
  }
};

/* ═══════════════════════════════════════════════
   10. GLOBAL SEARCH
═══════════════════════════════════════════════ */
const GlobalSearch = {
  init() {
    el('gsCloseBtn').addEventListener('click', () => this.close());
    el('globalSearchOverlay').addEventListener('click', e => { if (e.target === el('globalSearchOverlay')) this.close(); });
    el('gsInput').addEventListener('input', () => this._search(el('gsInput').value));
  },
  open() {
    el('globalSearchOverlay').classList.add('is-open');
    el('cmdOverlay').classList.remove('is-open');
    el('gsInput').value = ''; this._search('');
    setTimeout(() => el('gsInput').focus(), 40);
  },
  close() { el('globalSearchOverlay').classList.remove('is-open'); },
  _search(q) {
    const lower = q.toLowerCase();
    let html = '';
    const tpls = TEMPLATES.filter(t => !q || t.name.toLowerCase().includes(lower) || t.tags.join(',').toLowerCase().includes(lower)).slice(0, 5);
    if (tpls.length) {
      html += '<div class="cmd-group-title">Templates</div>';
      html += tpls.map(t =>
        `<div class="cmd-result-item" style="cursor:pointer" data-tpl="${escHtml(t.id)}">
          <div class="cmd-result-icon">${t.icon}</div>
          <div class="cmd-result-text"><div class="cmd-result-title">${escHtml(t.name)}</div><div class="cmd-result-sub">${escHtml(t.category)} · ${escHtml(t.difficulty)}</div></div>
        </div>`
      ).join('');
    }
    const topics = LEARNING_TOPICS.filter(t => !q || t.name.toLowerCase().includes(lower)).slice(0, 4);
    if (topics.length) {
      html += '<div class="cmd-group-title">Learning Topics</div>';
      html += topics.map(t =>
        `<div class="cmd-result-item" style="cursor:pointer" data-topic="${escHtml(t.id)}">
          <div class="cmd-result-icon">${t.icon}</div>
          <div class="cmd-result-text"><div class="cmd-result-title">${escHtml(t.name)}</div><div class="cmd-result-sub">Learning Hub</div></div>
        </div>`
      ).join('');
    }
    const projs = (STATE.projects || []).filter(p => !q || p.name.toLowerCase().includes(lower)).slice(0, 3);
    if (projs.length) {
      html += '<div class="cmd-group-title">Projects</div>';
      html += projs.map(p =>
        `<div class="cmd-result-item" style="cursor:pointer" data-proj="${escHtml(p.id)}">
          <div class="cmd-result-icon">🏗️</div>
          <div class="cmd-result-text"><div class="cmd-result-title">${escHtml(p.name)}</div><div class="cmd-result-sub">${escHtml(fmtDate(p.updatedAt))}</div></div>
        </div>`
      ).join('');
    }
    if (!html) html = '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px">Start typing to search templates, topics, projects…</div>';
    el('gsResults').innerHTML = html;
    qsa('.cmd-result-item[data-tpl]', el('gsResults')).forEach(el2 => {
      el2.addEventListener('click', () => { TemplatesModule.loadTemplate(el2.dataset.tpl); this.close(); });
    });
    qsa('.cmd-result-item[data-topic]', el('gsResults')).forEach(el2 => {
      el2.addEventListener('click', () => { Router.go('learning'); setTimeout(() => LearningModule.openTopic(el2.dataset.topic), 200); this.close(); });
    });
    qsa('.cmd-result-item[data-proj]', el('gsResults')).forEach(el2 => {
      el2.addEventListener('click', () => { ProjectsModule.openProject(el2.dataset.proj); this.close(); });
    });
  }
};

/* ═══════════════════════════════════════════════
   11. NOTIFICATIONS
═══════════════════════════════════════════════ */
const NotifModule = {
  add(icon, title, sub) {
    if (!STATE.notifications) STATE.notifications = [];
    STATE.notifications.unshift({ icon, title, sub, ts: Date.now() });
    STATE.notifications = STATE.notifications.slice(0, 30);
    saveState();
    el('notifDot').style.display = 'block';
  },
  render() {
    const list = STATE.notifications || [];
    if (!list.length) { el('notifDrawerBody').innerHTML = '<div class="notif-empty">No notifications</div>'; return; }
    el('notifDrawerBody').innerHTML = list.map(n =>
      `<div class="notif-item"><div class="notif-item-icon">${n.icon}</div><div><div class="notif-item-title">${escHtml(n.title)}</div><div class="notif-item-sub">${escHtml(n.sub)}</div></div></div>`
    ).join('');
  }
};

/* ═══════════════════════════════════════════════
   12. DASHBOARD MODULE
═══════════════════════════════════════════════ */
const DashboardModule = {
  _rendered: false,
  render() {
    this._updateStats();
    this._renderRecentProjects();
    this._renderFeaturedTemplates();
    this._renderLearningProgress();
    this._renderHeatmap();
    this._renderAchievements();
    if (!this._rendered) {
      this._rendered = true;
      el('dashNewDesignBtn').addEventListener('click', () => { BuilderModule.newProject(); Router.go('builder'); });
    }
  },
  _updateStats() {
    const p = STATE.projects.length, s = STATE.simulations.length;
    const topicCount = LEARNING_TOPICS.length;
    const learnedCount = Object.values(STATE.learningProgress).filter(v => v >= 100).length;
    const learnPct = topicCount ? Math.round((learnedCount / topicCount) * 100) : 0;
    el('dashHeroTitle').textContent = STATE.xp > 0 ? `Welcome back, Architect 👋` : 'Welcome to SDS Pro';
    animNum(el('statProjects'), p);
    animNum(el('statSims'), s);
    animNum(el('statLearn'), learnPct, '%');
    animNum(el('statXP'), STATE.xp);
    setTimeout(() => {
      el('barProjects').style.width = Math.min(p * 10, 100) + '%';
      el('barSims').style.width = Math.min(s * 5, 100) + '%';
      el('barLearn').style.width = learnPct + '%';
      el('barXP').style.width = Math.min(STATE.xp / 50, 100) + '%';
    }, 100);
    el('trendProjects').textContent = `+${p}`;
    el('trendSims').textContent = `+${s}`;
    el('trendLearn').textContent = `+${learnPct}%`;
    el('trendXP').textContent = `+${STATE.xp}`;
  },
  _renderRecentProjects() {
    const projs = (STATE.projects || []).slice(-4).reverse();
    if (!projs.length) { el('recentProjectsEmpty').style.display = 'flex'; el('recentProjectsList').innerHTML = ''; el('recentProjectsList').appendChild(el('recentProjectsEmpty')); return; }
    el('recentProjectsList').innerHTML = projs.map(p =>
      `<div class="recent-proj-item" data-proj="${escHtml(p.id)}">
        <div class="rpi-icon">🏗️</div>
        <div class="rpi-info"><div class="rpi-name">${escHtml(p.name)}</div><div class="rpi-meta">${escHtml(fmtDate(p.updatedAt))} · ${(p.nodes || []).length} components</div></div>
        <div class="rpi-action">→</div>
      </div>`
    ).join('');
    qsa('.recent-proj-item', el('recentProjectsList')).forEach(el2 => {
      el2.addEventListener('click', () => ProjectsModule.openProject(el2.dataset.proj));
    });
  },
  _renderFeaturedTemplates() {
    const featured = TEMPLATES.slice(0, 4);
    el('featuredTemplatesList').innerHTML = featured.map(t =>
      `<div class="feat-template-item" data-tpl="${escHtml(t.id)}">
        <div class="rpi-icon">${t.icon}</div>
        <div class="rpi-info"><div class="rpi-name">${escHtml(t.name)}</div><div class="rpi-meta">${escHtml(t.category)} · ${escHtml(t.difficulty)}</div></div>
        <div class="rpi-action">→</div>
      </div>`
    ).join('');
    qsa('.feat-template-item', el('featuredTemplatesList')).forEach(el2 => {
      el2.addEventListener('click', () => TemplatesModule.loadTemplate(el2.dataset.tpl));
    });
  },
  _renderLearningProgress() {
    const topics = LEARNING_TOPICS.slice(0, 6);
    el('learningProgressList').innerHTML = topics.map(t => {
      const pct = STATE.learningProgress[t.id] || 0;
      return `<div class="lp-item">
        <div class="lp-header"><span class="lp-name">${t.icon} ${escHtml(t.name)}</span><span class="lp-pct">${pct}%</span></div>
        <div class="lp-bar"><div class="lp-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  },
  _renderHeatmap() {
    const today = new Date();
    let html = '';
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = STATE.activity[key] || 0;
      const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
      html += `<div class="hm-cell" data-level="${level}" title="${key}: ${count} action${count !== 1 ? 's' : ''}"></div>`;
    }
    el('activityHeatmap').innerHTML = html;
  },
  _renderAchievements() {
    el('achievementsGrid').innerHTML = ACHIEVEMENTS.map(a => {
      const earned = (STATE.earnedAchievements || []).includes(a.id);
      return `<div class="ach-badge ${earned ? 'is-earned' : 'is-locked'}" title="${escHtml(a.desc)}">
        <span class="ach-badge-icon">${a.icon}</span>
        <span class="ach-badge-name">${escHtml(a.name)}</span>
      </div>`;
    }).join('');
  }
};

/* ═══════════════════════════════════════════════
   13. ARCHITECTURE BUILDER
═══════════════════════════════════════════════ */
const BuilderModule = {
  _rendered: false,
  _tool: 'select',
  _selected: null,
  _connectFrom: null,
  _isDragging: false,
  _dragOffset: { x: 0, y: 0 },
  _zoom: 1,
  _panX: 0,
  _panY: 0,
  _isPanning: false,
  _panStart: { x: 0, y: 0 },
  _undoStack: [],
  _redoStack: [],
  _nodes: [],
  _connections: [],
  _idCounter: 0,

  render() {
    if (!this._rendered) {
      this._rendered = true;
      this._buildPalette();
      this._initToolbar();
      this._initCanvas();
      this._initProps();
      this._loadFromState();
    }
    this._drawAll();
  },

  newProject() {
    this._nodes = [];
    this._connections = [];
    this._selected = null;
    this._connectFrom = null;
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
    this._undoStack = [];
    this._redoStack = [];
    this._drawAll();
    el('canvasEmptyHint').classList.remove('is-hidden');
    el('builderPropsPanel').style.display = 'none';
    el('zoomLabel').textContent = '100%';
  },

  _buildPalette() {
    const cats = [...new Set(COMPONENTS.map(c => c.category))];
    let html = '';
    cats.forEach(cat => {
      const items = COMPONENTS.filter(c => c.category === cat);
      html += `<div class="palette-category-title">${escHtml(cat)}</div>`;
      html += items.map(c =>
        `<div class="palette-item" draggable="true" data-type="${escHtml(c.type)}" title="${escHtml(c.desc)}">
          <div class="palette-item-icon">${c.icon}</div>
          <div class="palette-item-name">${escHtml(c.name)}</div>
        </div>`
      ).join('');
    });
    el('paletteBody').innerHTML = html;

    qsa('.palette-item', el('paletteBody')).forEach(item => {
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('componentType', item.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });

    el('paletteSearch').addEventListener('input', () => {
      const q = el('paletteSearch').value.toLowerCase();
      qsa('.palette-item', el('paletteBody')).forEach(item => {
        const name = item.querySelector('.palette-item-name').textContent.toLowerCase();
        item.style.display = name.includes(q) ? '' : 'none';
      });
    });
  },

  _initToolbar() {
    const setTool = (toolId) => {
      this._tool = toolId;
      this._connectFrom = null;
      qsa('.builder-tool-btn').forEach(b => b.classList.remove('active'));
      const btn = el('tool' + toolId.charAt(0).toUpperCase() + toolId.slice(1));
      if (btn) btn.classList.add('active');
      el('builderSVG').style.cursor = toolId === 'connect' ? 'crosshair' : toolId === 'select' ? 'default' : 'default';
    };
    el('toolSelect').addEventListener('click', () => setTool('select'));
    el('toolConnect').addEventListener('click', () => setTool('connect'));
    el('toolDelete').addEventListener('click', () => this._deleteSelected());
    el('toolUndo').addEventListener('click', () => this._undo());
    el('toolRedo').addEventListener('click', () => this._redo());
    el('toolZoomIn').addEventListener('click', () => this._setZoom(this._zoom * 1.2));
    el('toolZoomOut').addEventListener('click', () => this._setZoom(this._zoom / 1.2));
    el('toolFitView').addEventListener('click', () => this._fitView());
    el('gridToggle').addEventListener('change', () => {
      STATE.gridEnabled = el('gridToggle').checked;
      el('gridBg').style.display = STATE.gridEnabled ? '' : 'none';
      saveState();
    });
    el('gridBg').style.display = STATE.gridEnabled !== false ? '' : 'none';
    el('gridToggle').checked = STATE.gridEnabled !== false;
    el('saveDesignBtn').addEventListener('click', () => this._saveCurrentProject());
    el('runSimBtn').addEventListener('click', () => { Toast.show('info', 'Load the Simulators tab to run animations on your architecture.'); Router.go('simulator'); });
  },

  _initCanvas() {
    const svg = el('builderSVG');
    const container = el('builderCanvasContainer');

    // Drop from palette
    container.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    container.addEventListener('drop', e => {
      e.preventDefault();
      const type = e.dataTransfer.getData('componentType');
      if (!type) return;
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left - this._panX) / this._zoom;
      const y = (e.clientY - rect.top - this._panY) / this._zoom;
      this._addNode(type, Math.round(x / 20) * 20, Math.round(y / 20) * 20);
    });

    // SVG mouse events
    svg.addEventListener('mousedown', e => this._onSVGMouseDown(e));
    svg.addEventListener('mousemove', e => this._onSVGMouseMove(e));
    svg.addEventListener('mouseup', e => this._onSVGMouseUp(e));
    svg.addEventListener('wheel', e => { e.preventDefault(); const factor = e.deltaY < 0 ? 1.1 : 0.9; this._setZoom(this._zoom * factor, e.clientX, e.clientY); }, { passive: false });
    svg.addEventListener('dblclick', e => { const node = e.target.closest('.svg-node'); if (node) this._editNodeLabel(node.dataset.id); });
    svg.addEventListener('contextmenu', e => { e.preventDefault(); const node = e.target.closest('.svg-node'); if (node) { this._selectNode(node.dataset.id); this._deleteSelected(); } });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (Router.current !== 'builder') return;
      if (isTypingTarget(e.target)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') this._deleteSelected();
      if (e.key === 'Escape') { this._selected = null; this._connectFrom = null; this._drawAll(); el('builderPropsPanel').style.display = 'none'; }
      if (e.key === 'f' || e.key === 'F') this._fitView();
      if (e.key === '+' || e.key === '=') this._setZoom(this._zoom * 1.15);
      if (e.key === '-') this._setZoom(this._zoom / 1.15);
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this._undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); this._redo(); }
    });
  },

  _initProps() {
    el('propsPanelClose').addEventListener('click', () => { el('builderPropsPanel').style.display = 'none'; this._selected = null; this._drawAll(); });
  },

  _loadFromState() {
    if (STATE.builderState && STATE.builderState.nodes?.length) {
      this._nodes = STATE.builderState.nodes;
      this._connections = STATE.builderState.connections || [];
      this._zoom = STATE.builderState.zoom || 1;
      this._panX = STATE.builderState.panX || 0;
      this._panY = STATE.builderState.panY || 0;
      this._idCounter = Math.max(...this._nodes.map(n => parseInt(n.id.split('-')[1]) || 0), 0);
      if (this._nodes.length) el('canvasEmptyHint').classList.add('is-hidden');
    }
  },

  _svgPoint(e) {
    const rect = el('builderSVG').getBoundingClientRect();
    return { x: (e.clientX - rect.left - this._panX) / this._zoom, y: (e.clientY - rect.top - this._panY) / this._zoom };
  },

  _onSVGMouseDown(e) {
    const node = e.target.closest('.svg-node');
    const connection = e.target.closest('.svg-connection');
    if (node) {
      if (this._tool === 'connect') {
        if (!this._connectFrom) { this._connectFrom = node.dataset.id; el('builderSVG').style.cursor = 'crosshair'; }
        else { const toId = node.dataset.id; if (toId !== this._connectFrom) this._addConnection(this._connectFrom, toId); this._connectFrom = null; }
      } else {
        this._selectNode(node.dataset.id);
        this._isDragging = true;
        const n = this._nodes.find(n => n.id === node.dataset.id);
        if (n) { const pt = this._svgPoint(e); this._dragOffset = { x: pt.x - n.x, y: pt.y - n.y }; }
      }
    } else if (connection) {
      this._selected = null; this._drawAll();
    } else {
      this._selected = null; this._connectFrom = null;
      this._isPanning = true;
      this._panStart = { x: e.clientX - this._panX, y: e.clientY - this._panY };
      el('builderSVG').style.cursor = 'grabbing';
      this._drawAll();
      el('builderPropsPanel').style.display = 'none';
    }
    e.preventDefault();
  },

  _onSVGMouseMove(e) {
    if (this._isDragging && this._selected) {
      const pt = this._svgPoint(e);
      const n = this._nodes.find(n => n.id === this._selected);
      if (n) { n.x = Math.round((pt.x - this._dragOffset.x) / 20) * 20; n.y = Math.round((pt.y - this._dragOffset.y) / 20) * 20; this._drawAll(); }
    } else if (this._isPanning) {
      this._panX = e.clientX - this._panStart.x;
      this._panY = e.clientY - this._panStart.y;
      this._applyTransform();
    }
  },

  _onSVGMouseUp(e) {
    if (this._isDragging) { this._isDragging = false; this._saveBuilderState(); }
    if (this._isPanning) { this._isPanning = false; el('builderSVG').style.cursor = this._tool === 'connect' ? 'crosshair' : 'default'; }
  },

  _addNode(type, x, y) {
    this._pushUndo();
    const comp = COMPONENTS.find(c => c.type === type) || COMPONENTS[0];
    const node = { id: `n-${++this._idCounter}`, type, x: x || 100 + this._nodes.length * 30, y: y || 150, label: comp.name, color: comp.color };
    this._nodes.push(node);
    this._drawAll();
    this._selectNode(node.id);
    el('canvasEmptyHint').classList.add('is-hidden');
    this._saveBuilderState();
    Gamification.addXP(5);
  },

  _addConnection(fromId, toId) {
    if (this._connections.some(c => c.from === fromId && c.to === toId)) return;
    this._pushUndo();
    this._connections.push({ from: fromId, to: toId, label: '' });
    this._drawAll();
    this._saveBuilderState();
  },

  _selectNode(id) {
    this._selected = id;
    this._drawAll();
    const n = this._nodes.find(n => n.id === id);
    if (n) this._showProps(n);
  },

  _deleteSelected() {
    if (!this._selected) return;
    this._pushUndo();
    this._nodes = this._nodes.filter(n => n.id !== this._selected);
    this._connections = this._connections.filter(c => c.from !== this._selected && c.to !== this._selected);
    this._selected = null;
    el('builderPropsPanel').style.display = 'none';
    this._drawAll();
    this._saveBuilderState();
    if (!this._nodes.length) el('canvasEmptyHint').classList.remove('is-hidden');
  },

  _editNodeLabel(id) {
    const n = this._nodes.find(n => n.id === id);
    if (!n) return;
    const newLabel = prompt('Edit label:', n.label);
    if (newLabel !== null) { n.label = newLabel; this._drawAll(); this._saveBuilderState(); }
  },

  _showProps(node) {
    const comp = COMPONENTS.find(c => c.type === node.type);
    el('propsPanelTitle').textContent = comp?.name || node.type;
    el('propsPanelBody').innerHTML = `
      <div class="prop-field">
        <div class="prop-label">Label</div>
        <input class="prop-input" id="propLabelInput" value="${escHtml(node.label)}" placeholder="Component label">
      </div>
      <div class="prop-field">
        <div class="prop-label">Type</div>
        <div style="font-size:13px;color:var(--text-2)">${comp?.icon || ''} ${escHtml(comp?.name || node.type)}</div>
      </div>
      <div class="prop-field">
        <div class="prop-label">Description</div>
        <div style="font-size:12.5px;color:var(--text-3);line-height:1.5">${escHtml(comp?.desc || '')}</div>
      </div>
      <div class="prop-field">
        <div class="prop-label">Color</div>
        <div class="prop-color-row" id="propColorRow">
          ${['#6366F1','#8B5CF6','#10B981','#EF4444','#F59E0B','#06B6D4','#F97316','#64748B'].map(c =>
            `<div class="prop-color-dot ${node.color === c ? 'is-selected' : ''}" style="background:${c}" data-color="${c}"></div>`
          ).join('')}
        </div>
      </div>`;
    el('builderPropsPanel').style.display = 'block';
    el('propLabelInput').addEventListener('input', () => {
      node.label = el('propLabelInput').value;
      this._drawAll();
    });
    el('propLabelInput').addEventListener('change', () => this._saveBuilderState());
    qsa('.prop-color-dot', el('propsPanelBody')).forEach(dot => {
      dot.addEventListener('click', () => {
        node.color = dot.dataset.color;
        qsa('.prop-color-dot').forEach(d => d.classList.toggle('is-selected', d.dataset.color === node.color));
        this._drawAll(); this._saveBuilderState();
      });
    });
  },

  _drawAll() {
    this._applyTransform();
    this._drawConnections();
    this._drawNodes();
  },

  _applyTransform() {
    const g1 = el('connectionsLayer'), g2 = el('componentsLayer');
    const transform = `translate(${this._panX},${this._panY}) scale(${this._zoom})`;
    g1.setAttribute('transform', transform);
    g2.setAttribute('transform', transform);
    el('gridBg').setAttribute('transform', `translate(${this._panX % 20},${this._panY % 20})`);
  },

  _drawNodes() {
    const layer = el('componentsLayer');
    layer.innerHTML = '';
    this._nodes.forEach(node => {
      const comp = COMPONENTS.find(c => c.type === node.type);
      const W = 110, H = 60;
      const isSelected = node.id === this._selected;
      const isConnFrom = node.id === this._connectFrom;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `svg-node${isSelected ? ' is-selected' : ''}`);
      g.setAttribute('data-id', node.id);
      g.innerHTML = `
        <rect class="svg-node-rect" x="${node.x}" y="${node.y}" width="${W}" height="${H}" rx="10" ry="10"
          fill="${isSelected ? 'var(--accent-soft)' : 'var(--bg-elevated)'}"
          stroke="${isSelected ? 'var(--accent)' : isConnFrom ? '#F59E0B' : node.color || 'var(--border-strong)'}"
          stroke-width="${isSelected ? 2 : 1.5}"/>
        <text x="${node.x + W / 2}" y="${node.y + 22}" text-anchor="middle" fill="var(--text-1)" font-family="Inter,sans-serif" font-size="18">${comp?.icon || '📦'}</text>
        <text x="${node.x + W / 2}" y="${node.y + 45}" text-anchor="middle" fill="var(--text-1)" font-family="Inter,sans-serif" font-size="10" font-weight="600">${escHtml(node.label.slice(0, 14))}</text>`;
      layer.appendChild(g);
    });
  },

  _drawConnections() {
    const layer = el('connectionsLayer');
    layer.innerHTML = '';
    this._connections.forEach(conn => {
      const from = this._nodes.find(n => n.id === conn.from);
      const to = this._nodes.find(n => n.id === conn.to);
      if (!from || !to) return;
      const W = 110, H = 60;
      const x1 = from.x + W, y1 = from.y + H / 2;
      const x2 = to.x, y2 = to.y + H / 2;
      const mx = (x1 + x2) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
      path.setAttribute('class', 'svg-connection');
      path.setAttribute('stroke', 'var(--connection-color)');
      path.setAttribute('stroke-width', '1.8');
      path.setAttribute('fill', 'none');
      path.setAttribute('marker-end', 'url(#arrowMarker)');
      layer.appendChild(path);
      if (conn.label) {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', mx); txt.setAttribute('y', (y1 + y2) / 2 - 4);
        txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('fill', 'var(--text-3)');
        txt.setAttribute('font-size', '10'); txt.setAttribute('font-family', 'Inter,sans-serif');
        txt.textContent = conn.label;
        layer.appendChild(txt);
      }
    });
  },

  _setZoom(z, cx, cy) {
    const oldZoom = this._zoom;
    this._zoom = clamp(z, 0.2, 3);
    if (cx !== undefined && cy !== undefined) {
      const rect = el('builderSVG').getBoundingClientRect();
      const mouseX = cx - rect.left, mouseY = cy - rect.top;
      this._panX = mouseX - (mouseX - this._panX) * (this._zoom / oldZoom);
      this._panY = mouseY - (mouseY - this._panY) * (this._zoom / oldZoom);
    }
    el('zoomLabel').textContent = Math.round(this._zoom * 100) + '%';
    this._applyTransform();
  },

  _fitView() {
    if (!this._nodes.length) return;
    const W = 110, H = 60;
    const xs = this._nodes.map(n => n.x); const ys = this._nodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs) + W;
    const minY = Math.min(...ys), maxY = Math.max(...ys) + H;
    const container = el('builderCanvasContainer');
    const cw = container.clientWidth, ch = container.clientHeight;
    const z = clamp(Math.min(cw / (maxX - minX + 80), ch / (maxY - minY + 80)) * 0.9, 0.2, 2);
    this._zoom = z;
    this._panX = (cw - (maxX - minX) * z) / 2 - minX * z;
    this._panY = (ch - (maxY - minY) * z) / 2 - minY * z;
    el('zoomLabel').textContent = Math.round(z * 100) + '%';
    this._applyTransform();
  },

  _pushUndo() { this._undoStack.push(JSON.stringify({ nodes: this._nodes, connections: this._connections })); if (this._undoStack.length > 30) this._undoStack.shift(); this._redoStack = []; },
  _undo() { if (!this._undoStack.length) return; this._redoStack.push(JSON.stringify({ nodes: this._nodes, connections: this._connections })); const prev = JSON.parse(this._undoStack.pop()); this._nodes = prev.nodes; this._connections = prev.connections; this._selected = null; this._drawAll(); this._saveBuilderState(); },
  _redo() { if (!this._redoStack.length) return; this._undoStack.push(JSON.stringify({ nodes: this._nodes, connections: this._connections })); const next = JSON.parse(this._redoStack.pop()); this._nodes = next.nodes; this._connections = next.connections; this._selected = null; this._drawAll(); this._saveBuilderState(); },

  _saveBuilderState() {
    STATE.builderState = { nodes: this._nodes, connections: this._connections, zoom: this._zoom, panX: this._panX, panY: this._panY };
    saveState();
  },

  _saveCurrentProject() {
    if (!this._nodes.length) { Toast.show('warn', 'Add some components before saving.'); return; }
    const existing = STATE.currentProjectId ? STATE.projects.find(p => p.id === STATE.currentProjectId) : null;
    const name = existing ? existing.name : prompt('Project name:', 'My Architecture') || 'Untitled Architecture';
    if (!name) return;
    if (existing) {
      existing.nodes = [...this._nodes]; existing.connections = [...this._connections]; existing.updatedAt = Date.now();
    } else {
      const proj = { id: 'p-' + Date.now(), name, nodes: [...this._nodes], connections: [...this._connections], createdAt: Date.now(), updatedAt: Date.now() };
      STATE.projects.push(proj);
      STATE.currentProjectId = proj.id;
    }
    saveState();
    Gamification.addXP(20);
    Gamification.checkAchievements();
    Toast.show('success', `Architecture "${name}" saved!`);
    NotifModule.add('💾', 'Design saved', name);
  },

  loadFromTemplate(tpl) {
    this._pushUndo();
    this._nodes = tpl.nodes.map((n, i) => ({ id: `n-${++this._idCounter}`, type: n.type, x: n.x, y: n.y, label: COMPONENTS.find(c => c.type === n.type)?.name || n.type, color: COMPONENTS.find(c => c.type === n.type)?.color || '#6366F1' }));
    this._connections = (tpl.connections || []).map(([fi, ti]) => ({ from: this._nodes[fi]?.id, to: this._nodes[ti]?.id, label: '' })).filter(c => c.from && c.to);
    this._drawAll();
    el('canvasEmptyHint').classList.add('is-hidden');
    setTimeout(() => this._fitView(), 100);
    this._saveBuilderState();
  }
};

/* ═══════════════════════════════════════════════
   14. SIMULATORS MODULE
═══════════════════════════════════════════════ */
const SIM_CATALOG = [
  { id: 'lb',    icon: '⚖️', title: 'Load Balancer',     desc: 'Visualize Round Robin, Least Connections, and IP Hash algorithms distributing traffic across servers.',       tags: ['Algorithms', 'Traffic', 'Servers'] },
  { id: 'cache', icon: '⚡', title: 'Cache Simulator',    desc: 'Observe cache hits, misses, TTL expiry, LRU eviction, and the performance impact of different cache strategies.', tags: ['Redis', 'Hit Rate', 'Eviction'] },
  { id: 'db',    icon: '🗄️', title: 'Database Replication', desc: 'Watch primary-replica replication, replication lag, failover, and read/write splitting in real time.',      tags: ['Primary', 'Replica', 'Failover'] },
  { id: 'queue', icon: '📨', title: 'Message Queue',      desc: 'Simulate producers, consumers, backlog growth, DLQ routing, and consumer scaling with Kafka/RabbitMQ.',       tags: ['Kafka', 'Consumer', 'DLQ'] },
  { id: 'cdn',   icon: '🌐', title: 'CDN & Edge',         desc: 'See how requests route to the nearest edge PoP and how cache propagation reduces origin load globally.',       tags: ['Edge', 'Latency', 'Global'] },
  { id: 'auth',  icon: '🔐', title: 'Auth & JWT',         desc: 'Step through OAuth 2.0 and JWT authentication flows, token refresh, and session management.',                   tags: ['OAuth', 'JWT', 'Security'] }
];

const SimulatorModule = {
  _rendered: false,
  _activeSimId: null,
  _animFrame: null,
  _canvas: null,
  _ctx: null,

  render() {
    if (!this._rendered) {
      this._rendered = true;
      this._buildGrid();
      el('simCloseBtn').addEventListener('click', () => {
        cancelAnimationFrame(this._animFrame);
        el('simActivePanel').style.display = 'none';
        this._activeSimId = null;
      });
    }
  },

  _buildGrid() {
    el('simulatorsGrid').innerHTML = SIM_CATALOG.map(s =>
      `<div class="sim-card" data-simid="${escHtml(s.id)}">
        <div class="sim-card-icon">${s.icon}</div>
        <div class="sim-card-title">${escHtml(s.title)}</div>
        <div class="sim-card-desc">${escHtml(s.desc)}</div>
        <div class="sim-card-tags">${s.tags.map(t => `<span class="sim-tag">${escHtml(t)}</span>`).join('')}</div>
      </div>`
    ).join('');
    qsa('.sim-card').forEach(card => card.addEventListener('click', () => this._openSim(card.dataset.simid)));
  },

  _openSim(id) {
    cancelAnimationFrame(this._animFrame);
    this._activeSimId = id;
    const sim = SIM_CATALOG.find(s => s.id === id);
    el('simPanelTitle').textContent = sim?.title || 'Simulator';
    el('simActivePanel').style.display = 'block';
    el('simPanelBody').innerHTML = this._buildSimUI(id);
    el('simActivePanel').scrollIntoView({ behavior: 'smooth' });
    this._canvas = qs('canvas', el('simPanelBody'));
    if (this._canvas) { this._ctx = this._canvas.getContext('2d'); this._startSim(id); }
    STATE.simulations.push({ id, ts: Date.now() }); saveState();
    Gamification.addXP(15); Gamification.checkAchievements();
    updateTopbarCounters();
  },

  _buildSimUI(id) {
    const metrics = { lb: ['Requests/sec', 'Avg Latency', 'Error Rate', 'Active Servers'], cache: ['Hit Rate', 'Miss Rate', 'Evictions', 'Memory Used'], db: ['Writes/sec', 'Reads/sec', 'Repl Lag', 'Connections'], queue: ['Queue Depth', 'Consumers', 'Msg/sec', 'DLQ Size'], cdn: ['Cache Hit%', 'Origin Load', 'Avg RTT', 'Edge Nodes'], auth: ['Auth Req/s', 'Token Issued', 'Rejections', 'Active Sessions'] }[id] || [];
    return `<canvas class="sim-canvas" id="simCanvas" height="320"></canvas>
    <div class="sim-metric-grid">${metrics.map((m, i) => `<div class="sim-metric"><div class="sim-metric-val" id="simMetric${i}">—</div><div class="sim-metric-lbl">${escHtml(m)}</div></div>`).join('')}</div>
    <div class="sim-controls"><button class="btn btn-primary btn-sm" id="simPauseBtn">Pause</button><button class="btn btn-outline btn-sm" id="simRestartBtn">Restart</button></div>`;
  },

  _startSim(id) {
    const canvas = this._canvas;
    if (!canvas) return;
    canvas.width = canvas.clientWidth;
    canvas.height = 320;
    const ctx = this._ctx;
    let paused = false;
    let t = 0;

    const pauseBtn = el('simPauseBtn');
    const restartBtn = el('simRestartBtn');
    if (pauseBtn) { pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Resume' : 'Pause'; }; }
    if (restartBtn) { restartBtn.onclick = () => { t = 0; }; }

    const W = canvas.width, H = canvas.height;
    const simFns = {
      lb: () => this._drawLBSim(ctx, W, H, t),
      cache: () => this._drawCacheSim(ctx, W, H, t),
      db: () => this._drawDBSim(ctx, W, H, t),
      queue: () => this._drawQueueSim(ctx, W, H, t),
      cdn: () => this._drawCDNSim(ctx, W, H, t),
      auth: () => this._drawAuthSim(ctx, W, H, t)
    };

    const loop = () => {
      if (!paused) { t += 0.016 * (STATE.simSpeed || 1); if (simFns[id]) simFns[id](); this._updateSimMetrics(id, t); }
      this._animFrame = requestAnimationFrame(loop);
    };
    loop();
  },

  _clrBg(ctx, W, H) { ctx.fillStyle = Charts._isDark() ? '#0D0E15' : '#F8F9FF'; ctx.fillRect(0, 0, W, H); },
  _textC() { return Charts._isDark() ? '#9BA3B8' : '#4B5263'; },

  _drawLBSim(ctx, W, H, t) {
    this._clrBg(ctx, W, H);
    const servers = [{ x: W * 0.7, y: H * 0.2 }, { x: W * 0.7, y: H * 0.5 }, { x: W * 0.7, y: H * 0.8 }];
    const lb = { x: W * 0.45, y: H * 0.5 };
    const client = { x: W * 0.15, y: H * 0.5 };
    // Draw nodes
    [[client, '💻', 'Client'], [lb, '⚖️', 'Load Balancer']].forEach(([pos, icon, label]) => {
      ctx.fillStyle = Charts._isDark() ? '#1E2030' : '#FFF';
      ctx.strokeStyle = '#6366F1'; ctx.lineWidth = 1.5;
      this._roundRect(ctx, pos.x - 45, pos.y - 22, 90, 44, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6366F1'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
      ctx.fillText(label, pos.x, pos.y + 4);
    });
    servers.forEach((s, i) => {
      const load = (Math.sin(t * 2 + i * 1.2) + 1) / 2;
      const c = `hsl(${130 - load * 120}, 70%, 50%)`;
      ctx.fillStyle = Charts._isDark() ? '#1E2030' : '#FFF';
      ctx.strokeStyle = c; ctx.lineWidth = 1.5;
      this._roundRect(ctx, s.x - 40, s.y - 20, 80, 40, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = c; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(`Server ${i + 1}`, s.x, s.y); ctx.fillText(`${Math.round(load * 100)}%`, s.x, s.y + 12);
    });
    // Animated packets
    [0, 1, 2].forEach((lane, i) => {
      const progress = ((t * 0.6 + i * 0.33) % 1);
      // client → lb
      if (progress < 0.45) {
        const px = client.x + (lb.x - client.x - 45) * (progress / 0.45);
        const py = client.y;
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#6366F1'; ctx.fill();
      } else {
        // lb → server
        const srv = servers[i % servers.length];
        const p2 = (progress - 0.45) / 0.55;
        const px = lb.x + 45 + (srv.x - 40 - lb.x - 45) * p2;
        const py = lb.y + (srv.y - lb.y) * p2;
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = ['#10B981', '#F59E0B', '#8B5CF6'][i]; ctx.fill();
      }
    });
    // Connections
    ctx.strokeStyle = Charts._isDark() ? 'rgba(99,102,241,0.25)' : 'rgba(79,70,229,0.2)';
    ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(client.x + 45, client.y); ctx.lineTo(lb.x - 45, lb.y); ctx.stroke();
    servers.forEach(s => { ctx.beginPath(); ctx.moveTo(lb.x + 45, lb.y); ctx.lineTo(s.x - 40, s.y); ctx.stroke(); });
    ctx.setLineDash([]);
  },

  _drawCacheSim(ctx, W, H, t) {
    this._clrBg(ctx, W, H);
    const client = { x: W * 0.12, y: H * 0.5 };
    const cache = { x: W * 0.42, y: H * 0.3 };
    const db = { x: W * 0.72, y: H * 0.5 };
    const nodes = [[client, '#6366F1', '💻 Client'], [cache, '#EAB308', '⚡ Cache'], [db, '#EF4444', '🗄️ Database']];
    nodes.forEach(([pos, color, label]) => {
      ctx.fillStyle = Charts._isDark() ? '#1E2030' : '#FFF';
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      this._roundRect(ctx, pos.x - 48, pos.y - 22, 96, 44, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(label, pos.x, pos.y + 4);
    });
    // Cache cells
    const cells = 8;
    for (let i = 0; i < cells; i++) {
      const age = (t * 0.3 + i * 0.7) % 4;
      const alpha = Math.max(0, 1 - age / 4);
      ctx.fillStyle = `rgba(234,179,8,${alpha * 0.6})`;
      ctx.fillRect(cache.x - 44 + i * 11.5, cache.y + 25, 10, 12);
    }
    // Packets
    const phase = t * 0.5 % 1;
    const isHit = Math.sin(t) > 0;
    const px = client.x + 48 + (cache.x - 48 - client.x - 48) * Math.min(phase * 2, 1);
    const py = client.y + (cache.y - client.y) * Math.min(phase * 2, 1);
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = isHit ? '#10B981' : '#EF4444'; ctx.fill();
    ctx.fillStyle = this._textC(); ctx.font = '11px Inter'; ctx.textAlign = 'center';
    ctx.fillText(isHit ? '✓ HIT' : '✗ MISS', cache.x, H * 0.65);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = Charts._isDark() ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(client.x + 48, client.y); ctx.lineTo(cache.x - 48, cache.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cache.x + 48, cache.y); ctx.lineTo(db.x - 48, db.y); ctx.stroke();
    ctx.setLineDash([]);
  },

  _drawDBSim(ctx, W, H, t) {
    this._clrBg(ctx, W, H);
    const primary = { x: W * 0.3, y: H * 0.35 };
    const replica1 = { x: W * 0.65, y: H * 0.25 };
    const replica2 = { x: W * 0.65, y: H * 0.65 };
    [[primary, '#EF4444', '🗄️ Primary'], [replica1, '#F97316', '📋 Replica 1'], [replica2, '#F97316', '📋 Replica 2']].forEach(([pos, color, label]) => {
      ctx.fillStyle = Charts._isDark() ? '#1E2030' : '#FFF';
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      this._roundRect(ctx, pos.x - 52, pos.y - 24, 104, 48, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.fillText(label, pos.x, pos.y + 4);
    });
    // Replication packets
    [replica1, replica2].forEach((r, i) => {
      const p = ((t * 0.4 + i * 0.5) % 1);
      const lag = 0.3 + Math.sin(t * 0.7 + i) * 0.15;
      const px = primary.x + 52 + (r.x - 52 - primary.x - 52) * p;
      const py = primary.y + (r.y - primary.y) * p;
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = p > lag ? '#10B981' : '#F59E0B'; ctx.fill();
    });
    ctx.setLineDash([6, 4]); ctx.strokeStyle = '#EF444455'; ctx.lineWidth = 1.5;
    [replica1, replica2].forEach(r => { ctx.beginPath(); ctx.moveTo(primary.x + 52, primary.y); ctx.lineTo(r.x - 52, r.y); ctx.stroke(); });
    ctx.setLineDash([]);
  },

  _drawQueueSim(ctx, W, H, t) {
    this._clrBg(ctx, W, H);
    const prod = { x: W * 0.12, y: H * 0.5 };
    const queueX = W * 0.35, queueW = W * 0.3;
    const cons1 = { x: W * 0.85, y: H * 0.3 };
    const cons2 = { x: W * 0.85, y: H * 0.7 };
    [[prod, '#8B5CF6', '📤 Producer'], [cons1, '#10B981', '📥 Consumer 1'], [cons2, '#10B981', '📥 Consumer 2']].forEach(([pos, color, label]) => {
      ctx.fillStyle = Charts._isDark() ? '#1E2030' : '#FFF';
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      this._roundRect(ctx, pos.x - 52, pos.y - 22, 104, 44, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.font = 'bold 10.5px Inter'; ctx.textAlign = 'center'; ctx.fillText(label, pos.x, pos.y + 4);
    });
    // Queue box
    ctx.fillStyle = Charts._isDark() ? '#16181F' : '#F0F1F8';
    ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1.5;
    this._roundRect(ctx, queueX, H * 0.3, queueW, H * 0.4, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#F59E0B'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.fillText('📨 Message Queue', queueX + queueW / 2, H * 0.3 + 18);
    // Messages in queue
    const depth = Math.floor(3 + Math.sin(t * 0.5) * 2);
    for (let i = 0; i < Math.min(depth, 6); i++) {
      ctx.fillStyle = `rgba(245,158,11,0.7)`;
      ctx.fillRect(queueX + 10 + i * 32, H * 0.46, 24, 16);
    }
    ctx.fillStyle = this._textC(); ctx.font = '10px Inter'; ctx.fillText(`${depth} msgs`, queueX + queueW / 2, H * 0.3 + 36);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = Charts._isDark() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(prod.x + 52, prod.y); ctx.lineTo(queueX, H * 0.5); ctx.stroke();
    [cons1, cons2].forEach(c => { ctx.beginPath(); ctx.moveTo(queueX + queueW, H * 0.5); ctx.lineTo(c.x - 52, c.y); ctx.stroke(); });
    ctx.setLineDash([]);
  },

  _drawCDNSim(ctx, W, H, t) {
    this._clrBg(ctx, W, H);
    const origin = { x: W * 0.5, y: H * 0.5 };
    const edges = [
      { x: W * 0.15, y: H * 0.2, label: '🇮🇳 India' },
      { x: W * 0.82, y: H * 0.25, label: '🇺🇸 USA' },
      { x: W * 0.85, y: H * 0.7, label: '🇯🇵 Japan' },
      { x: W * 0.15, y: H * 0.75, label: '🇧🇷 Brazil' },
      { x: W * 0.5, y: H * 0.15, label: '🇬🇧 Europe' }
    ];
    ctx.fillStyle = Charts._isDark() ? '#1E2030' : '#FFF';
    ctx.strokeStyle = '#06B6D4'; ctx.lineWidth = 2;
    this._roundRect(ctx, origin.x - 50, origin.y - 22, 100, 44, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#06B6D4'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.fillText('🌐 Origin', origin.x, origin.y + 4);
    edges.forEach((e, i) => {
      const cached = Math.sin(t * 0.3 + i) > 0;
      ctx.fillStyle = Charts._isDark() ? '#1E2030' : '#FFF';
      ctx.strokeStyle = cached ? '#10B981' : '#F59E0B'; ctx.lineWidth = 1.5;
      this._roundRect(ctx, e.x - 40, e.y - 18, 80, 36, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = cached ? '#10B981' : '#F59E0B'; ctx.font = '10px Inter'; ctx.textAlign = 'center'; ctx.fillText(e.label, e.x, e.y + 4);
      // Packet
      const p = ((t * 0.4 + i * 0.2) % 1);
      const px = e.x + (origin.x - e.x) * p, py = e.y + (origin.y - e.y) * p;
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = cached ? '#10B981' : '#06B6D4'; ctx.fill();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = Charts._isDark() ? 'rgba(6,182,212,0.2)' : 'rgba(6,182,212,0.15)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(origin.x, origin.y); ctx.stroke();
      ctx.setLineDash([]);
    });
  },

  _drawAuthSim(ctx, W, H, t) {
    this._clrBg(ctx, W, H);
    const steps = [
      { x: W * 0.1, y: H * 0.5, label: '💻 Client', color: '#6366F1' },
      { x: W * 0.35, y: H * 0.5, label: '🔀 Gateway', color: '#F59E0B' },
      { x: W * 0.6, y: H * 0.3, label: '🔐 Auth', color: '#EF4444' },
      { x: W * 0.6, y: H * 0.7, label: '⚙️ Service', color: '#10B981' },
      { x: W * 0.85, y: H * 0.5, label: '🗄️ Database', color: '#8B5CF6' }
    ];
    steps.forEach(s => {
      ctx.fillStyle = Charts._isDark() ? '#1E2030' : '#FFF';
      ctx.strokeStyle = s.color; ctx.lineWidth = 1.5;
      this._roundRect(ctx, s.x - 44, s.y - 20, 88, 40, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = s.color; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center'; ctx.fillText(s.label, s.x, s.y + 4);
    });
    const totalPhases = 4, phase = (t * 0.35) % totalPhases;
    const paths = [[0, 1], [1, 2], [2, 3], [3, 4]];
    const curPath = Math.floor(phase); const curProgress = phase - curPath;
    if (paths[curPath]) {
      const [fi, ti] = paths[curPath];
      const from = steps[fi], to = steps[ti];
      const px = from.x + (to.x - from.x) * curProgress, py = from.y + (to.y - from.y) * curProgress;
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#6366F1'; ctx.fill();
    }
    ctx.setLineDash([4, 4]); ctx.strokeStyle = Charts._isDark() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
    [[0,1],[1,2],[1,3],[2,3],[3,4]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(steps[a].x + 44, steps[a].y); ctx.lineTo(steps[b].x - 44, steps[b].y); ctx.stroke(); });
    ctx.setLineDash([]);
  },

  _roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); },

  _updateSimMetrics(id, t) {
    const sets = {
      lb:    [Math.round(400 + Math.sin(t) * 80), Math.round(45 + Math.cos(t) * 12) + 'ms', (Math.abs(Math.sin(t * 0.3)) * 2).toFixed(1) + '%', 3],
      cache: [Math.round(72 + Math.sin(t * 0.5) * 12) + '%', Math.round(28 - Math.sin(t * 0.5) * 12) + '%', Math.round(Math.abs(Math.sin(t * 0.2)) * 5), Math.round(62 + Math.sin(t * 0.3) * 8) + '%'],
      db:    [Math.round(120 + Math.sin(t) * 30), Math.round(380 + Math.cos(t) * 60), Math.round(Math.abs(Math.sin(t * 0.4)) * 200) + 'ms', Math.round(45 + Math.sin(t * 0.2) * 10)],
      queue: [Math.round(3 + Math.abs(Math.sin(t * 0.5)) * 5), 2, Math.round(200 + Math.sin(t) * 50), Math.floor(Math.abs(Math.sin(t * 0.2)) * 3)],
      cdn:   [Math.round(85 + Math.sin(t * 0.3) * 8) + '%', Math.round(15 - Math.sin(t * 0.3) * 8) + '%', Math.round(28 + Math.abs(Math.sin(t * 0.5)) * 15) + 'ms', 5],
      auth:  [Math.round(150 + Math.sin(t) * 40), Math.round(145 + Math.sin(t) * 38), Math.round(Math.abs(Math.sin(t * 0.3)) * 8), Math.round(1200 + Math.sin(t * 0.2) * 200)]
    };
    const vals = sets[id] || [];
    vals.forEach((v, i) => { const m = el(`simMetric${i}`); if (m) m.textContent = v; });
  }
};

/* ═══════════════════════════════════════════════
   15. TRAFFIC GENERATOR
═══════════════════════════════════════════════ */
const TrafficModule = {
  _rendered: false,
  _running: false,
  _animFrame: null,
  _t: 0,
  _rps: 1000,
  _pattern: 'normal',
  _errorRate: 2,

  render() {
    if (!this._rendered) { this._rendered = true; this._buildConfig(); }
  },

  _buildConfig() {
    el('trafficConfigBody').innerHTML = `
      <div class="traffic-config-row">
        <div class="config-label">Traffic Volume</div>
        <div class="config-options" id="trafficVolumeOpts">
          ${[['100 RPS','100'],['1K RPS','1000'],['10K RPS','10000'],['100K RPS','100000']].map(([l,v]) =>
            `<button class="config-option-btn ${v === '1000' ? 'is-selected' : ''}" data-val="${v}">${l}</button>`
          ).join('')}
        </div>
      </div>
      <div class="traffic-config-row">
        <div class="config-label">Traffic Pattern</div>
        <div class="config-options" id="trafficPatternOpts">
          ${[['Normal','normal'],['Spike','spike'],['Black Friday','blackfriday'],['Viral','viral']].map(([l,v]) =>
            `<button class="config-option-btn ${v === 'normal' ? 'is-selected' : ''}" data-val="${v}">${l}</button>`
          ).join('')}
        </div>
      </div>
      <div class="traffic-config-row">
        <div class="config-label">Error Rate</div>
        <div class="config-options" id="trafficErrorOpts">
          ${[['0%','0'],['2%','2'],['10%','10'],['30%','30']].map(([l,v]) =>
            `<button class="config-option-btn ${v === '2' ? 'is-selected' : ''}" data-val="${v}">${l}</button>`
          ).join('')}
        </div>
      </div>
      <button class="btn btn-primary" id="startTrafficBtn">▶ Start Simulation</button>
      <button class="btn btn-outline" id="stopTrafficBtn" style="display:none">⏹ Stop</button>`;

    this._initConfigListeners();
    this._buildMetricsRow();
    this._setupCanvas();
  },

  _initConfigListeners() {
    el('trafficVolumeOpts').addEventListener('click', e => {
      const btn = e.target.closest('.config-option-btn'); if (!btn) return;
      qsa('.config-option-btn', el('trafficVolumeOpts')).forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected'); this._rps = parseInt(btn.dataset.val);
    });
    el('trafficPatternOpts').addEventListener('click', e => {
      const btn = e.target.closest('.config-option-btn'); if (!btn) return;
      qsa('.config-option-btn', el('trafficPatternOpts')).forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected'); this._pattern = btn.dataset.val;
    });
    el('trafficErrorOpts').addEventListener('click', e => {
      const btn = e.target.closest('.config-option-btn'); if (!btn) return;
      qsa('.config-option-btn', el('trafficErrorOpts')).forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected'); this._errorRate = parseInt(btn.dataset.val);
    });
    el('startTrafficBtn').addEventListener('click', () => this._start());
    el('stopTrafficBtn').addEventListener('click', () => this._stop());
  },

  _buildMetricsRow() {
    el('trafficMetricsRow').innerHTML = [
      ['tm0', 'Requests/sec', '#6366F1'],
      ['tm1', 'Avg Latency', '#10B981'],
      ['tm2', 'Error Rate', '#EF4444'],
      ['tm3', 'Throughput', '#F59E0B'],
      ['tm4', 'P99 Latency', '#8B5CF6']
    ].map(([id, lbl, color]) =>
      `<div class="traffic-metric"><div class="tm-val" id="${id}" style="color:${color}">—</div><div class="tm-lbl">${lbl}</div></div>`
    ).join('');
  },

  _setupCanvas() {
    const canvas = el('trafficCanvas');
    canvas.width = canvas.clientWidth || 600; canvas.height = 320;
  },

  _start() {
    this._running = true; this._t = 0;
    el('startTrafficBtn').style.display = 'none'; el('stopTrafficBtn').style.display = '';
    el('trafficStatusChip').textContent = 'Running'; el('trafficStatusChip').className = 'status-chip status-chip--running';
    el('simStatusDot').className = 'sss-dot sss-dot--running'; el('simStatusLabel').textContent = 'Traffic simulation';
    this._loop();
  },

  _stop() {
    this._running = false; cancelAnimationFrame(this._animFrame);
    el('startTrafficBtn').style.display = ''; el('stopTrafficBtn').style.display = 'none';
    el('trafficStatusChip').textContent = 'Stopped'; el('trafficStatusChip').className = 'status-chip status-chip--idle';
    el('simStatusDot').className = 'sss-dot sss-dot--idle'; el('simStatusLabel').textContent = 'Idle';
  },

  _loop() {
    if (!this._running) return;
    this._t += 0.016;
    this._draw(); this._updateMetrics();
    this._animFrame = requestAnimationFrame(() => this._loop());
  },

  _currentRPS() {
    const base = this._rps;
    const patterns = { normal: 1 + Math.sin(this._t * 0.5) * 0.2, spike: this._t % 8 < 1 ? 5 : 1, blackfriday: 1 + Math.abs(Math.sin(this._t * 0.3)) * 3, viral: Math.exp(Math.min(this._t * 0.1, 2)) };
    return base * (patterns[this._pattern] || 1);
  },

  _draw() {
    const canvas = el('trafficCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    ctx.fillStyle = Charts._isDark() ? '#0D0E15' : '#F8F9FF'; ctx.fillRect(0, 0, W, H);
    // Draw flowing request lines
    const rps = this._currentRPS();
    const lineCount = Math.min(Math.floor(rps / 100) + 3, 40);
    for (let i = 0; i < lineCount; i++) {
      const progress = ((this._t * 0.4 + i * (1 / lineCount)) % 1);
      const y = 30 + (i / lineCount) * (H - 60);
      const x = progress * W;
      const isError = Math.random() < this._errorRate / 100;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = isError ? '#EF4444' : '#6366F1'; ctx.fill();
    }
    // RPS graph
    const graphH = 80, graphY = H - graphH - 10;
    ctx.fillStyle = Charts._isDark() ? 'rgba(99,102,241,0.08)' : 'rgba(79,70,229,0.05)';
    ctx.fillRect(0, graphY, W, graphH);
    ctx.strokeStyle = Charts._isDark() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, graphY); ctx.lineTo(W, graphY); ctx.stroke();
    const maxRPS = this._rps * 5;
    ctx.beginPath();
    for (let xi = 0; xi <= W; xi += 4) {
      const timeOffset = (W - xi) / W * 10;
      const tAtX = this._t - timeOffset;
      if (tAtX < 0) continue;
      const rpsAtX = this._rps * { normal: 1 + Math.sin(tAtX * 0.5) * 0.2, spike: tAtX % 8 < 1 ? 5 : 1, blackfriday: 1 + Math.abs(Math.sin(tAtX * 0.3)) * 3, viral: Math.exp(Math.min(tAtX * 0.1, 2)) }[this._pattern];
      const yy = graphY + graphH - (rpsAtX / maxRPS) * graphH;
      xi === 0 ? ctx.moveTo(xi, yy) : ctx.lineTo(xi, yy);
    }
    ctx.strokeStyle = '#6366F1'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = Charts._isDark() ? '#9BA3B8' : '#4B5263'; ctx.font = '10px Inter'; ctx.textAlign = 'left';
    ctx.fillText(`RPS: ${Math.round(this._currentRPS()).toLocaleString()}`, 10, graphY - 5);
  },

  _updateMetrics() {
    const rps = this._currentRPS();
    const latency = Math.round(20 + (rps / this._rps) * 80);
    el('tm0').textContent = Math.round(rps).toLocaleString();
    el('tm1').textContent = latency + 'ms';
    el('tm2').textContent = this._errorRate + '%';
    el('tm3').textContent = (rps * 2.4 / 1000).toFixed(1) + ' MB/s';
    el('tm4').textContent = Math.round(latency * 3.5) + 'ms';
  }
};

/* ═══════════════════════════════════════════════
   16. FAILURE SIMULATOR
═══════════════════════════════════════════════ */
const FAILURE_SCENARIOS = [
  { id: 'db_fail',    icon: '🗄️', title: 'Database Failure',         desc: 'Primary database crashes. Watch how the system detects failure, promotes a replica, and recovers traffic.' },
  { id: 'server_fail',icon: '🖥️', title: 'Server Failure',           desc: 'An application server fails mid-request. Observe load balancer health checks and automatic traffic rerouting.' },
  { id: 'cache_fail', icon: '⚡', title: 'Cache Failure',             desc: 'Redis cache goes down. See the cache stampede problem and how circuit breakers protect the database.' },
  { id: 'net_fail',   icon: '🌐', title: 'Network Partition',         desc: 'Network split between data centers. CAP theorem in action: choose consistency or availability.' },
  { id: 'cascade',    icon: '🌊', title: 'Cascading Failure',         desc: 'One slow service causes timeouts upstream, triggering a cascade. See how bulkheads and timeouts help.' },
  { id: 'region_fail',icon: '🌍', title: 'Region Failure',            desc: 'An entire cloud region goes down. Multi-region failover routes traffic to healthy regions automatically.' }
];

const FailureModule = {
  _rendered: false, _animFrame: null,

  render() {
    if (!this._rendered) {
      this._rendered = true;
      el('failuresGrid').innerHTML = FAILURE_SCENARIOS.map(f =>
        `<div class="failure-card" data-failid="${escHtml(f.id)}">
          <div class="failure-card-icon">${f.icon}</div>
          <div class="failure-card-title">${escHtml(f.title)}</div>
          <div class="failure-card-desc">${escHtml(f.desc)}</div>
        </div>`
      ).join('');
      qsa('.failure-card').forEach(card => card.addEventListener('click', () => this._openScenario(card.dataset.failid)));
      el('failureScenarioClose').addEventListener('click', () => {
        cancelAnimationFrame(this._animFrame);
        el('failureScenarioPanel').style.display = 'none';
      });
    }
  },

  _openScenario(id) {
    cancelAnimationFrame(this._animFrame);
    const scenario = FAILURE_SCENARIOS.find(f => f.id === id);
    el('failureScenarioTitle').textContent = scenario?.title || 'Scenario';
    el('failureScenarioPanel').style.display = 'block';
    el('failureScenarioPanel').scrollIntoView({ behavior: 'smooth' });
    const canvas = el('failureCanvas');
    canvas.width = canvas.clientWidth || 800; canvas.height = 300;
    el('failureLog').innerHTML = '';
    this._runScenario(id, canvas);
  },

  _log(msg, type = 'info') {
    const line = document.createElement('div');
    line.className = `failure-log-line failure-log-line--${type}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    line.textContent = `[${time}] ${msg}`;
    el('failureLog').insertBefore(line, el('failureLog').firstChild);
  },

  _runScenario(id, canvas) {
    const ctx = canvas.getContext('2d');
    let t = 0, phase = 'normal';
    const phases = { db_fail: ['normal','failure','detecting','failover','recovery'], server_fail: ['normal','failure','detecting','rerouting','recovery'], cache_fail: ['normal','failure','stampede','circuitbreak','recovery'], net_fail: ['normal','partition','isolated','reconverge','recovery'], cascade: ['normal','slowdown','cascade','bulkhead','recovery'], region_fail: ['normal','failure','detecting','failover','recovery'] };
    const phaseList = phases[id] || ['normal'];
    let phaseIdx = 0;
    const schedulePhase = (delay, idx, msg, logMsg, logType = 'warn') => {
      setTimeout(() => { phaseIdx = idx; phase = phaseList[idx] || 'normal'; if (logMsg) this._log(logMsg, logType); }, delay);
    };
    schedulePhase(1500, 1, 'failure', '⚠ Component failure detected!', 'error');
    schedulePhase(3000, 2, 'detecting', '🔍 Health checks failing...', 'warn');
    schedulePhase(5000, 3, 'failover', '🔄 Initiating failover procedure...', 'warn');
    schedulePhase(7000, 4, 'recovery', '✅ System recovered successfully!', 'ok');
    this._log('▶ Starting scenario...', 'info');
    const loop = () => {
      t += 0.016;
      this._drawFailure(ctx, canvas.width, canvas.height, id, phaseList[phaseIdx] || 'normal', t);
      this._animFrame = requestAnimationFrame(loop);
    };
    loop();
  },

  _drawFailure(ctx, W, H, id, phase, t) {
    ctx.fillStyle = Charts._isDark() ? '#0D0E15' : '#F8F9FF'; ctx.fillRect(0, 0, W, H);
    const nodes = [
      { x: W * 0.1, y: H * 0.5, label: '💻 Client', color: '#6366F1', status: 'ok' },
      { x: W * 0.3, y: H * 0.5, label: '⚖️ LB', color: '#10B981', status: phase === 'failure' || phase === 'detecting' ? 'warn' : 'ok' },
      { x: W * 0.5, y: H * 0.3, label: '⚙️ Server 1', color: '#8B5CF6', status: phase === 'failure' || phase === 'cascade' || phase === 'slowdown' ? 'error' : 'ok' },
      { x: W * 0.5, y: H * 0.7, label: '⚙️ Server 2', color: '#8B5CF6', status: 'ok' },
      { x: W * 0.7, y: H * 0.5, label: '🗄️ DB', color: '#EF4444', status: id === 'db_fail' && (phase === 'failure' || phase === 'detecting') ? 'error' : phase === 'failover' || phase === 'recovery' ? 'ok' : 'ok' },
      { x: W * 0.9, y: H * 0.5, label: '📋 Replica', color: '#F97316', status: phase === 'failover' || phase === 'recovery' ? 'ok' : 'idle' }
    ];
    ctx.setLineDash([5, 4]); ctx.strokeStyle = Charts._isDark() ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    [[0,1],[1,2],[1,3],[2,4],[3,4],[4,5]].forEach(([a,b]) => { ctx.beginPath(); ctx.moveTo(nodes[a].x + 40, nodes[a].y); ctx.lineTo(nodes[b].x - 40, nodes[b].y); ctx.stroke(); });
    ctx.setLineDash([]);
    nodes.forEach(n => {
      const colors = { ok: n.color, error: '#EF4444', warn: '#F59E0B', idle: '#64748B' };
      const glow = n.status === 'error' ? `rgba(239,68,68,${0.3 + Math.sin(t * 5) * 0.2})` : n.status === 'ok' && phase === 'recovery' ? 'rgba(16,185,129,0.3)' : 'transparent';
      if (glow !== 'transparent') { ctx.shadowColor = glow; ctx.shadowBlur = 15; }
      ctx.fillStyle = Charts._isDark() ? '#1E2030' : '#FFF';
      ctx.strokeStyle = colors[n.status] || n.color; ctx.lineWidth = n.status === 'error' ? 2.5 : 1.5;
      SimulatorModule._roundRect(ctx, n.x - 40, n.y - 20, 80, 40, 8); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = colors[n.status] || n.color; ctx.font = 'bold 9.5px Inter'; ctx.textAlign = 'center'; ctx.fillText(n.label, n.x, n.y + 4);
      if (n.status === 'error') {
        ctx.fillStyle = '#EF4444'; ctx.font = 'bold 12px Inter'; ctx.fillText('✕', n.x, n.y - 24);
      } else if (phase === 'recovery' && n.status === 'ok') {
        ctx.fillStyle = '#10B981'; ctx.font = '11px Inter'; ctx.fillText('✓', n.x, n.y - 24);
      }
    });
    // Phase label
    const phaseColors = { normal: '#10B981', failure: '#EF4444', detecting: '#F59E0B', failover: '#8B5CF6', recovery: '#10B981', stampede: '#F97316', cascade: '#EF4444', partition: '#F59E0B' };
    ctx.fillStyle = phaseColors[phase] || '#6366F1'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
    ctx.fillText(`Phase: ${phase.toUpperCase()}`, W / 2, 20);
  }
};

/* ═══════════════════════════════════════════════
   17. TEMPLATES MODULE
═══════════════════════════════════════════════ */
const TemplatesModule = {
  _rendered: false, _filter: 'All',

  render() {
    if (!this._rendered) {
      this._rendered = true;
      this._buildFilters();
    }
    this._renderGrid();
  },

  _buildFilters() {
    const cats = ['All', ...new Set(TEMPLATES.map(t => t.category))];
    el('templatesFilters').innerHTML = cats.map(c =>
      `<button class="filter-chip ${c === 'All' ? 'is-active' : ''}" data-cat="${escHtml(c)}">${escHtml(c)}</button>`
    ).join('');
    el('templatesFilters').addEventListener('click', e => {
      const btn = e.target.closest('.filter-chip'); if (!btn) return;
      qsa('.filter-chip').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active'); this._filter = btn.dataset.cat; this._renderGrid();
    });
  },

  _renderGrid() {
    const list = this._filter === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === this._filter);
    el('templatesGrid').innerHTML = list.map(t =>
      `<div class="template-card" data-tpl="${escHtml(t.id)}">
        <div class="template-card-preview">${t.icon}</div>
        <div class="template-card-body">
          <div class="template-card-name">${escHtml(t.name)}</div>
          <div class="template-card-desc">${escHtml(t.desc)}</div>
          <div class="template-card-meta">
            <div class="template-card-tags">${t.tags.slice(0, 2).map(tag => `<span class="template-tag">${escHtml(tag)}</span>`).join('')}</div>
            <span class="template-card-difficulty template-card-difficulty--${t.difficulty}">${t.difficulty}</span>
          </div>
        </div>
      </div>`
    ).join('');
    qsa('.template-card').forEach(card => card.addEventListener('click', () => this.loadTemplate(card.dataset.tpl)));
  },

  loadTemplate(id) {
    const tpl = TEMPLATES.find(t => t.id === id);
    if (!tpl) return;
    BuilderModule.loadFromTemplate(tpl);
    Router.go('builder');
    Toast.show('success', `"${tpl.name}" template loaded!`);
    Gamification.addXP(10); Gamification.checkAchievements();
    NotifModule.add('📐', 'Template loaded', tpl.name);
  }
};

/* ═══════════════════════════════════════════════
   18. WHITEBOARD MODULE
═══════════════════════════════════════════════ */
const WhiteboardModule = {
  _rendered: false, _tool: 'pen', _drawing: false,
  _lastX: 0, _lastY: 0, _color: '#6366F1', _lineWidth: 3,
  _history: [], _historyIdx: -1,

  render() {
    if (!this._rendered) {
      this._rendered = true;
      this._buildToolbar();
      this._initCanvas();
    }
    this._resizeCanvas();
  },

  _buildToolbar() {
    const tools = [
      { id: 'pen',    icon: '✏️', title: 'Pen' },
      { id: 'eraser', icon: '🧹', title: 'Eraser' },
      { id: 'line',   icon: '╱',  title: 'Line' },
      { id: 'rect',   icon: '□',  title: 'Rectangle' },
      { id: 'circle', icon: '○',  title: 'Circle' },
      { id: 'text',   icon: 'T',  title: 'Text' }
    ];
    const colors = ['#6366F1', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#FFFFFF', '#0F1117'];
    const sizes = [2, 4, 8, 14];
    el('whiteboardToolbar').innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;width:100%">
        ${tools.map(t => `<button class="wb-tool-btn ${t.id === 'pen' ? 'active' : ''}" data-wbtool="${t.id}" title="${t.title}">${t.icon}</button>`).join('')}
        <div class="wb-sep"></div>
        ${colors.map(c => `<div style="width:20px;height:20px;border-radius:50%;background:${c};cursor:pointer;border:2px solid transparent;flex-shrink:0" data-wbcolor="${c}" title="${c}"></div>`).join('')}
        <div class="wb-sep"></div>
        ${sizes.map(s => `<button class="wb-tool-btn" data-wbsize="${s}" title="${s}px" style="font-size:${Math.max(10, s)}px">•</button>`).join('')}
        <div class="wb-sep"></div>
        <button class="wb-tool-btn" id="wbUndo" title="Undo">↩</button>
        <button class="wb-tool-btn" id="wbRedo" title="Redo">↪</button>
        <button class="wb-tool-btn" id="wbClear" title="Clear all">🗑️</button>
        <button class="btn btn-sm btn-outline" id="wbExport" title="Export PNG" style="margin-left:auto">Export PNG</button>
      </div>`;
    el('whiteboardToolbar').addEventListener('click', e => {
      const toolBtn = e.target.closest('[data-wbtool]');
      const sizeBtn = e.target.closest('[data-wbsize]');
      if (toolBtn) { this._tool = toolBtn.dataset.wbtool; qsa('[data-wbtool]', el('whiteboardToolbar')).forEach(b => b.classList.toggle('active', b === toolBtn)); }
      if (sizeBtn) { this._lineWidth = parseInt(sizeBtn.dataset.wbsize); }
      if (e.target.closest('#wbClear')) { const ctx = el('whiteboardCanvas').getContext('2d'); ctx.clearRect(0, 0, el('whiteboardCanvas').width, el('whiteboardCanvas').height); this._saveHistory(); }
      if (e.target.closest('#wbUndo')) this._undo();
      if (e.target.closest('#wbRedo')) this._redo();
      if (e.target.closest('#wbExport')) { const a = document.createElement('a'); a.href = el('whiteboardCanvas').toDataURL(); a.download = 'whiteboard.png'; a.click(); }
    });
    el('whiteboardToolbar').addEventListener('click', e => {
      const colorEl = e.target.closest('[data-wbcolor]');
      if (colorEl) { this._color = colorEl.dataset.wbcolor; qsa('[data-wbcolor]', el('whiteboardToolbar')).forEach(d => d.style.border = '2px solid transparent'); colorEl.style.border = '2px solid var(--text-1)'; }
    });
  },

  _initCanvas() {
    const canvas = el('whiteboardCanvas');
    canvas.addEventListener('mousedown', e => { this._drawing = true; [this._lastX, this._lastY] = [e.offsetX, e.offsetY]; if (this._tool === 'text') { const text = prompt('Enter text:'); if (text) { const ctx = canvas.getContext('2d'); ctx.fillStyle = this._color; ctx.font = `${16}px Inter`; ctx.fillText(text, e.offsetX, e.offsetY); this._saveHistory(); } this._drawing = false; } });
    canvas.addEventListener('mousemove', e => { if (!this._drawing) return; const ctx = canvas.getContext('2d'); if (this._tool === 'pen' || this._tool === 'eraser') { ctx.strokeStyle = this._tool === 'eraser' ? (Charts._isDark() ? '#0D0E15' : '#F8F9FF') : this._color; ctx.lineWidth = this._tool === 'eraser' ? this._lineWidth * 5 : this._lineWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(this._lastX, this._lastY); ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); [this._lastX, this._lastY] = [e.offsetX, e.offsetY]; } });
    canvas.addEventListener('mouseup', () => { if (this._drawing) { this._drawing = false; this._saveHistory(); } });
    canvas.addEventListener('mouseleave', () => { if (this._drawing) { this._drawing = false; this._saveHistory(); } });
    Gamification.checkAchievements();
  },

  _resizeCanvas() {
    const canvas = el('whiteboardCanvas');
    const saved = canvas.toDataURL();
    canvas.width = canvas.clientWidth || 800; canvas.height = canvas.clientHeight || 500;
    const img = new Image(); img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0); img.src = saved;
  },

  _saveHistory() { this._history = this._history.slice(0, this._historyIdx + 1); this._history.push(el('whiteboardCanvas').toDataURL()); this._historyIdx = this._history.length - 1; },
  _undo() { if (this._historyIdx <= 0) return; this._historyIdx--; this._restoreHistory(); },
  _redo() { if (this._historyIdx >= this._history.length - 1) return; this._historyIdx++; this._restoreHistory(); },
  _restoreHistory() { const img = new Image(); img.onload = () => { const ctx = el('whiteboardCanvas').getContext('2d'); ctx.clearRect(0, 0, el('whiteboardCanvas').width, el('whiteboardCanvas').height); ctx.drawImage(img, 0, 0); }; img.src = this._history[this._historyIdx]; }
};

/* ═══════════════════════════════════════════════
   19. LEARNING MODULE
═══════════════════════════════════════════════ */
const LearningModule = {
  _rendered: false, _activeTopic: null,

  render() {
    if (!this._rendered) { this._rendered = true; this._buildSidebar(); }
  },

  _buildSidebar() {
    el('learningTopicsSidebar').innerHTML = LEARNING_TOPICS.map(t => {
      const pct = STATE.learningProgress[t.id] || 0;
      return `<button class="learning-topic-btn" data-topicid="${escHtml(t.id)}">
        <span class="ltb-icon">${t.icon}</span>
        <span class="ltb-name">${escHtml(t.name)}</span>
        <span class="ltb-pct">${pct}%</span>
      </button>`;
    }).join('');
    qsa('.learning-topic-btn').forEach(btn => btn.addEventListener('click', () => this.openTopic(btn.dataset.topicid)));
  },

  openTopic(id) {
    this._activeTopic = id;
    const topic = LEARNING_TOPICS.find(t => t.id === id);
    if (!topic) return;
    qsa('.learning-topic-btn').forEach(b => b.classList.toggle('active', b.dataset.topicid === id));
    el('learningContentEmpty').style.display = 'none';
    el('learningContentBody').style.display = 'block';
    const pct = STATE.learningProgress[id] || 0;
    el('learningContentBody').innerHTML = `
      <h2>${topic.icon} ${escHtml(topic.name)}</h2>
      <span class="topic-badge">System Design Concept</span>
      <div class="topic-progress-bar"><div class="topic-progress-fill" style="width:${pct}%"></div></div>
      <p class="concept-text">${escHtml(topic.content.summary)}</p>
      <div class="key-points">
        <h4>Key Points</h4>
        ${topic.content.points.map(p => `<div class="key-point">${escHtml(p)}</div>`).join('')}
      </div>
      <p class="concept-text"><strong>Analogy:</strong> ${escHtml(topic.content.analogy)}</p>
      <div class="key-points">
        <h4>Related Topics</h4>
        ${topic.content.relatedTopics.map(r => `<div class="key-point">${escHtml(r)}</div>`).join('')}
      </div>
      <div class="topic-nav-row">
        <button class="btn btn-outline btn-sm" id="prevTopicBtn">← Previous</button>
        <button class="btn btn-primary" id="markCompleteBtn">${pct >= 100 ? '✓ Completed' : 'Mark as Complete'}</button>
        <button class="btn btn-outline btn-sm" id="nextTopicBtn">Next →</button>
      </div>`;
    el('markCompleteBtn').addEventListener('click', () => {
      STATE.learningProgress[id] = 100;
      saveState(); Gamification.addXP(30); Gamification.checkAchievements();
      this._buildSidebar(); this.openTopic(id);
      Toast.show('success', `"${topic.name}" marked as complete! +30 XP`);
      NotifModule.add('📚', 'Topic completed', topic.name);
    });
    const idx = LEARNING_TOPICS.findIndex(t => t.id === id);
    el('prevTopicBtn').addEventListener('click', () => { if (idx > 0) this.openTopic(LEARNING_TOPICS[idx - 1].id); });
    el('nextTopicBtn').addEventListener('click', () => { if (idx < LEARNING_TOPICS.length - 1) this.openTopic(LEARNING_TOPICS[idx + 1].id); });
    if (pct < 50) { STATE.learningProgress[id] = Math.max(pct, 25); saveState(); this._buildSidebar(); }
  }
};

/* ═══════════════════════════════════════════════
   20. INTERVIEW MODULE
═══════════════════════════════════════════════ */
const InterviewModule = {
  _rendered: false, _activeChallenge: null, _timer: null, _elapsed: 0,

  render() {
    if (!this._rendered) { this._rendered = true; this._buildLayout(); }
  },

  _buildLayout() {
    el('interviewLayout').innerHTML = `
      <div class="interview-challenges-grid" id="interviewChallengesGrid"></div>
      <div id="interviewActivePanel" style="display:none"></div>`;
    el('interviewChallengesGrid').innerHTML = INTERVIEW_CHALLENGES.map(c =>
      `<div class="challenge-card" data-cid="${escHtml(c.id)}">
        <div class="challenge-card-icon">${c.icon}</div>
        <div class="challenge-card-title">${escHtml(c.name)}</div>
        <div class="challenge-card-company">${escHtml(c.company)}</div>
        <div class="challenge-card-desc">${escHtml(c.desc)}</div>
        <div class="challenge-card-meta">
          <span class="challenge-difficulty challenge-difficulty--${c.difficulty}">${c.difficulty}</span>
          <span style="font-size:12px;color:var(--text-3)">⏱ ${c.time} min</span>
        </div>
      </div>`
    ).join('');
    qsa('.challenge-card').forEach(card => card.addEventListener('click', () => this._openChallenge(card.dataset.cid)));
  },

  _openChallenge(id) {
    clearInterval(this._timer); this._elapsed = 0;
    this._activeChallenge = id;
    const ch = INTERVIEW_CHALLENGES.find(c => c.id === id);
    if (!ch) return;
    const panel = el('interviewActivePanel');
    panel.style.display = 'block';
    panel.innerHTML = `
      <div class="interview-active-panel">
        <div class="interview-question-header">
          <div class="interview-question-title">${ch.icon} ${escHtml(ch.name)}</div>
          <div class="interview-timer" id="ivTimer">00:00</div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <button class="btn btn-sm btn-primary" id="ivStart">▶ Start Timer</button>
          <button class="btn btn-sm btn-outline" id="ivReset">Reset</button>
          <span class="challenge-difficulty challenge-difficulty--${ch.difficulty}" style="display:flex;align-items:center">${ch.difficulty}</span>
        </div>
        <p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px;line-height:1.65">${escHtml(ch.desc)}</p>
        <div class="interview-requirements">
          <h4>Requirements</h4>
          ${ch.requirements.map((r, i) => `<div class="requirement-item" id="req${i}" data-req="${i}">${escHtml(r)}</div>`).join('')}
        </div>
        <div class="interview-workspace">
          <div class="interview-workspace-label">Your design / approach</div>
          <textarea class="interview-textarea" id="ivAnswer" placeholder="Describe your system design approach…&#10;&#10;• Start with requirements clarification&#10;• Estimate scale and capacity&#10;• Design high-level architecture&#10;• Deep-dive into components&#10;• Address bottlenecks and trade-offs" rows="10"></textarea>
        </div>
        <div class="interview-eval-row" id="ivEvalRow">
          <div class="eval-btn" data-eval="scalability">Scalability</div>
          <div class="eval-btn" data-eval="reliability">Reliability</div>
          <div class="eval-btn" data-eval="performance">Performance</div>
          <div class="eval-btn" data-eval="maintainability">Maintainability</div>
        </div>
        <div style="display:flex;gap:10px;margin-top:14px">
          <button class="btn btn-primary" id="ivSubmit">Submit Design</button>
          <button class="btn btn-outline" id="ivClose">Close</button>
        </div>
      </div>`;
    el('ivStart').addEventListener('click', () => {
      this._timer = setInterval(() => {
        this._elapsed++;
        const m = String(Math.floor(this._elapsed / 60)).padStart(2, '0'), s = String(this._elapsed % 60).padStart(2, '0');
        const timerEl = el('ivTimer'); if (!timerEl) return;
        timerEl.textContent = `${m}:${s}`;
        const total = ch.time * 60;
        timerEl.className = 'interview-timer' + (this._elapsed > total * 0.75 ? ' is-warning' : '') + (this._elapsed > total ? ' is-danger' : '');
      }, 1000);
      el('ivStart').textContent = '⏸ Pause'; el('ivStart').onclick = () => { clearInterval(this._timer); el('ivStart').textContent = '▶ Resume'; el('ivStart').onclick = () => { this._timer = setInterval(() => {}, 1000); }; };
    });
    el('ivReset').addEventListener('click', () => { clearInterval(this._timer); this._elapsed = 0; el('ivTimer').textContent = '00:00'; el('ivTimer').className = 'interview-timer'; });
    qsa('.requirement-item').forEach(r => r.addEventListener('click', () => r.classList.toggle('is-checked')));
    qsa('.eval-btn').forEach(b => b.addEventListener('click', () => b.classList.toggle('is-active')));
    el('ivSubmit').addEventListener('click', () => {
      const answer = el('ivAnswer').value;
      if (answer.length < 50) { Toast.show('warn', 'Please write a more detailed design (at least a few sentences).'); return; }
      clearInterval(this._timer);
      Gamification.addXP(50); Gamification.checkAchievements();
      Toast.show('success', `Design submitted! +50 XP. Great work on "${ch.name}".`);
      NotifModule.add('🎯', 'Interview completed', ch.name);
      panel.style.display = 'none';
    });
    el('ivClose').addEventListener('click', () => { clearInterval(this._timer); panel.style.display = 'none'; });
    panel.scrollIntoView({ behavior: 'smooth' });
  }
};

/* ═══════════════════════════════════════════════
   21. COMPARISON MODULE
═══════════════════════════════════════════════ */
const ComparisonModule = {
  _rendered: false,

  render() {
    if (!this._rendered) {
      this._rendered = true;
      el('comparisonsGrid').innerHTML = COMPARISONS.map(c =>
        `<div class="comparison-card" data-cmpid="${escHtml(c.id)}">
          <div class="comparison-card-title">${escHtml(c.title)}</div>
          <div class="comparison-vs">
            <div class="comparison-side"><div class="comparison-side-name" style="color:${c.left.color}">${escHtml(c.left.name)}</div><div class="comparison-side-sub">${escHtml(c.left.sub)}</div></div>
            <div class="comparison-vs-badge">VS</div>
            <div class="comparison-side"><div class="comparison-side-name" style="color:${c.right.color}">${escHtml(c.right.name)}</div><div class="comparison-side-sub">${escHtml(c.right.sub)}</div></div>
          </div>
          <div class="comparison-desc">${escHtml(c.desc)}</div>
        </div>`
      ).join('');
      qsa('.comparison-card').forEach(card => card.addEventListener('click', () => this._openComparison(card.dataset.cmpid)));
      el('comparisonDetailClose').addEventListener('click', () => { el('comparisonDetail').style.display = 'none'; });
    }
  },

  _openComparison(id) {
    const cmp = COMPARISONS.find(c => c.id === id);
    if (!cmp) return;
    el('comparisonDetailTitle').textContent = cmp.title;
    el('comparisonDetailBody').innerHTML = `
      <div class="comparison-detail-grid">
        <div class="comparison-col">
          <div class="comparison-col-title comparison-col-title--left">${escHtml(cmp.left.name)}</div>
          <div class="comparison-feature-row">
            ${cmp.features.map(f => `
              <div class="comparison-feature">
                <div class="cf-label">${escHtml(f.label)}</div>
                <div class="cf-value">${escHtml(f.leftVal)}</div>
                <div class="cf-bar cf-bar--left" style="width:${f.leftScore}%"></div>
              </div>`).join('')}
          </div>
        </div>
        <div class="comparison-col">
          <div class="comparison-col-title comparison-col-title--right">${escHtml(cmp.right.name)}</div>
          <div class="comparison-feature-row">
            ${cmp.features.map(f => `
              <div class="comparison-feature">
                <div class="cf-label">${escHtml(f.label)}</div>
                <div class="cf-value">${escHtml(f.rightVal)}</div>
                <div class="cf-bar cf-bar--right" style="width:${f.rightScore}%"></div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
    el('comparisonDetail').style.display = 'block';
    el('comparisonDetail').scrollIntoView({ behavior: 'smooth' });
    Gamification.addXP(5); Gamification.checkAchievements();
  }
};

/* ═══════════════════════════════════════════════
   22. ANALYTICS MODULE
═══════════════════════════════════════════════ */
const AnalyticsModule = {
  _rendered: false,

  render() {
    if (this._rendered) return;
    this._rendered = true;
    setTimeout(() => requestAnimationFrame(() => this._drawCharts()), 150);
  },

  _drawCharts() {
    const COLORS = ['#6366F1', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4'];
    // Latency bar chart
    Charts.bar(el('chartLatency'), ['P50', 'P75', 'P90', 'P95', 'P99', 'P99.9'], [18, 32, 58, 120, 340, 980], COLORS);
    // Throughput line
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return d.toLocaleDateString([], { month: 'short', day: 'numeric' }); });
    Charts.line(el('chartThroughput'), days, [{ data: days.map((_, i) => 800 + i * 40 + Math.sin(i) * 120), color: '#6366F1', label: 'RPS' }, { data: days.map((_, i) => 200 + i * 10 + Math.cos(i) * 30), color: '#10B981', label: 'Errors' }]);
    // Error rate pie
    Charts.pie(el('chartErrors'), ['4xx Client', '5xx Server', '502 Gateway', 'Timeout'], [45, 30, 15, 10], ['#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']);
    // Cache pie
    Charts.pie(el('chartCache'), ['Hit', 'Miss', 'Evicted', 'Expired'], [72, 18, 6, 4], ['#10B981', '#EF4444', '#F59E0B', '#64748B']);
    // Resources line
    Charts.line(el('chartResources'), days, [
      { data: days.map((_, i) => 40 + i * 2 + Math.sin(i * 0.8) * 15), color: '#6366F1', label: 'CPU%' },
      { data: days.map((_, i) => 55 + i * 1.5 + Math.cos(i * 0.6) * 10), color: '#10B981', label: 'Memory%' },
      { data: days.map((_, i) => 20 + Math.abs(Math.sin(i)) * 40), color: '#F59E0B', label: 'Network' }
    ]);
  }
};

/* ═══════════════════════════════════════════════
   23. PROJECTS MODULE
═══════════════════════════════════════════════ */
const ProjectsModule = {
  _rendered: false,

  render() {
    this._rendered = true;
    this._renderGrid();
    if (!this._listenersAdded) {
      this._listenersAdded = true;
      el('newProjectFromProjBtn').addEventListener('click', () => { BuilderModule.newProject(); Router.go('builder'); });
      el('projectsEmptyNewBtn').addEventListener('click', () => { BuilderModule.newProject(); Router.go('builder'); });
    }
  },

  _renderGrid() {
    const projs = STATE.projects || [];
    if (!projs.length) {
      el('projectsGrid').innerHTML = '';
      el('projectsEmpty').style.display = 'flex';
      el('projectsGrid').appendChild(el('projectsEmpty'));
      return;
    }
    el('projectsGrid').innerHTML = [...projs].reverse().map(p =>
      `<div class="project-card">
        <div class="project-card-preview">🏗️</div>
        <div class="project-card-body">
          <div class="project-card-name">${escHtml(p.name)}</div>
          <div class="project-card-meta">${escHtml(fmtDate(p.updatedAt))}</div>
          <div class="project-card-footer">
            <span class="project-card-comp-count">${(p.nodes || []).length} components · ${(p.connections || []).length} connections</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-outline" data-openproj="${escHtml(p.id)}">Open</button>
              <button class="btn btn-sm btn-danger-outline" data-deleteproj="${escHtml(p.id)}">Delete</button>
            </div>
          </div>
        </div>
      </div>`
    ).join('');
    qsa('[data-openproj]').forEach(btn => btn.addEventListener('click', () => this.openProject(btn.dataset.openproj)));
    qsa('[data-deleteproj]').forEach(btn => btn.addEventListener('click', () => this._deleteProject(btn.dataset.deleteproj)));
  },

  openProject(id) {
    const proj = STATE.projects.find(p => p.id === id);
    if (!proj) return;
    STATE.currentProjectId = id;
    BuilderModule._nodes = JSON.parse(JSON.stringify(proj.nodes || []));
    BuilderModule._connections = JSON.parse(JSON.stringify(proj.connections || []));
    BuilderModule._idCounter = Math.max(...(proj.nodes || []).map(n => parseInt(n.id.split('-')[1]) || 0), 0);
    BuilderModule._selected = null;
    BuilderModule._connectFrom = null;
    // Navigate to builder — render() handles init if needed, then we draw
    Router.go('builder');
    setTimeout(() => {
      BuilderModule._drawAll();
      if (BuilderModule._nodes.length) {
        el('canvasEmptyHint').classList.add('is-hidden');
        BuilderModule._fitView();
      }
    }, 80);
    Toast.show('info', `Opened "${proj.name}"`);
  },

  async _deleteProject(id) {
    const proj = STATE.projects.find(p => p.id === id);
    if (!proj) return;
    const ok = await Modal.open('Delete project?', `"${proj.name}" will be permanently deleted.`, 'Delete');
    if (!ok) return;
    STATE.projects = STATE.projects.filter(p => p.id !== id);
    if (STATE.currentProjectId === id) STATE.currentProjectId = null;
    saveState(); this._renderGrid(); Toast.show('success', 'Project deleted.');
  }
};

/* ═══════════════════════════════════════════════
   24. SETTINGS MODULE
═══════════════════════════════════════════════ */
const SettingsModule = {
  _rendered: false,

  render() {
    if (!this._rendered) {
      this._rendered = true;
      this._wireSettings();
    }
    this._syncSettings();
  },

  _wireSettings() {
    qsa('.theme-pill').forEach(p => p.addEventListener('click', () => { ThemeSystem.set(p.dataset.theme); this._syncSettings(); }));
    el('settingsGridToggle').addEventListener('change', () => { STATE.gridEnabled = el('settingsGridToggle').checked; el('gridToggle') && (el('gridToggle').checked = STATE.gridEnabled); if (el('gridBg')) el('gridBg').style.display = STATE.gridEnabled ? '' : 'none'; saveState(); });
    el('settingsAnimToggle').addEventListener('change', () => { STATE.animations = el('settingsAnimToggle').checked; document.documentElement.setAttribute('data-anim', STATE.animations ? 'on' : 'off'); saveState(); });
    el('simSpeedSelect').addEventListener('change', () => { STATE.simSpeed = parseFloat(el('simSpeedSelect').value); saveState(); });
    el('packetCountSelect').addEventListener('change', () => { STATE.packetCount = parseInt(el('packetCountSelect').value); saveState(); });
    el('exportDataBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(Store.all(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `sds-backup-${todayStr()}.json`; a.click(); URL.revokeObjectURL(url);
      Toast.show('success', 'Data exported.');
    });
    el('importDataInput').addEventListener('change', async e => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(reader.result);
          const ok = await Modal.open('Import data?', 'This will overwrite all current data.', 'Import');
          if (!ok) return;
          Store.clearAll(); for (const k in data) localStorage.setItem(NS + k, data[k]);
          Toast.show('success', 'Data imported. Reloading…'); setTimeout(() => location.reload(), 800);
        } catch { Toast.show('error', 'Invalid backup file.'); }
        e.target.value = '';
      };
      reader.readAsText(file);
    });
    el('resetDataBtn').addEventListener('click', async () => {
      const ok = await Modal.open('Reset all data?', 'This permanently deletes all projects, progress and settings.', 'Reset Everything');
      if (ok) { Store.clearAll(); Toast.show('success', 'Data reset. Reloading…'); setTimeout(() => location.reload(), 800); }
    });
  },

  _syncSettings() {
    qsa('.theme-pill').forEach(p => p.classList.toggle('is-active', p.dataset.theme === STATE.theme));
    el('settingsGridToggle').checked = STATE.gridEnabled !== false;
    el('settingsAnimToggle').checked = STATE.animations !== false;
    el('simSpeedSelect').value = String(STATE.simSpeed || 1);
    el('packetCountSelect').value = String(STATE.packetCount || 10);
    el('settingsStorageInfo').textContent = `~${Store.sizeKB()} KB stored in this browser.`;
  }
};

/* ═══════════════════════════════════════════════
   25. GAMIFICATION
═══════════════════════════════════════════════ */
const Gamification = {
  addXP(amount) {
    STATE.xp = (STATE.xp || 0) + amount;
    el('sidebarXPValue').textContent = STATE.xp.toLocaleString();
    saveState();
  },
  checkAchievements() {
    const earned = STATE.earnedAchievements || [];
    const checks = [
      ['first_build',   (STATE.projects || []).length >= 1],
      ['first_sim',     (STATE.simulations || []).length >= 1],
      ['template_load', (STATE.xp || 0) >= 10],
      ['learner',       Object.values(STATE.learningProgress || {}).some(v => v >= 100)],
      ['xp_500',        (STATE.xp || 0) >= 500],
      ['xp_2000',       (STATE.xp || 0) >= 2000],
      ['builder_5',     (STATE.projects || []).length >= 5],
      ['streak_3',      (STATE.streak || 0) >= 3],
      ['compare',       (STATE.xp || 0) >= 5],
      ['whiteboard',    (STATE.xp || 0) >= 5]
    ];
    checks.forEach(([id, condition]) => {
      if (condition && !earned.includes(id)) {
        earned.push(id);
        STATE.earnedAchievements = earned;
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach && STATE.animations !== false) this._showPopup(ach);
        saveState();
      }
    });
  },
  _showPopup(ach) {
    const popup = el('achievementPopup');
    el('achPopupIcon').textContent = ach.icon;
    el('achPopupName').textContent = ach.name;
    popup.classList.add('is-open');
    setTimeout(() => { popup.classList.add('is-leaving'); setTimeout(() => popup.classList.remove('is-open', 'is-leaving'), 400); }, 3200);
  }
};

/* ═══════════════════════════════════════════════
   26. KEYBOARD SHORTCUTS
═══════════════════════════════════════════════ */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (isTypingTarget(e.target)) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); BuilderModule.newProject(); Router.go('builder'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (Router.current === 'builder') BuilderModule._saveCurrentProject(); }
  });
}

/* ═══════════════════════════════════════════════
   27. INIT
═══════════════════════════════════════════════ */
function updateDailyStreak() {
  const today = todayStr();
  if (!STATE.lastActiveDate) { STATE.streak = 1; STATE.lastActiveDate = today; }
  else if (STATE.lastActiveDate !== today) {
    const last = new Date(STATE.lastActiveDate), now = new Date(today);
    const diff = Math.floor((now - last) / 86400000);
    STATE.streak = diff === 1 ? (STATE.streak || 0) + 1 : 1;
    STATE.lastActiveDate = today;
  }
  STATE.activity[today] = (STATE.activity[today] || 0) + 1;
  saveState();
  el('streakVal').textContent = STATE.streak;
}

function init() {
  loadState();
  Toast.init();
  Modal.init();
  ThemeSystem.init();
  document.documentElement.setAttribute('data-anim', STATE.animations !== false ? 'on' : 'off');

  runSplash(() => {
    initSidebar();
    initTopbar();
    CmdPalette.init();
    GlobalSearch.init();
    Router.init();
    initKeyboardShortcuts();
    updateDailyStreak();
    Gamification.checkAchievements();

    // Seed notifications if first time
    if (!STATE.notifications?.length) {
      NotifModule.add('🎉', 'Welcome to SDS Pro!', 'Start by loading a template or exploring the simulators.');
      NotifModule.add('📐', 'Tip: Load Netflix template', 'See how a real streaming architecture is designed.');
    }

    // Render initial dashboard
    Router.go('dashboard');
    updateTopbarCounters();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();