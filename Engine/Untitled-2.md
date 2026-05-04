toprak-ve-kilic/
├── index.html                      # Main entry point
├── config.js                       # Game configuration
│
├── Engine/
│   ├── Core/
│   │   ├── ECS.js                 # ✅ Existing - Entity Component System
│   │   ├── EventBus.js            # ✅ Existing - Event system
│   │   ├── TimeSystem.js          # ✅ Existing - Time management
│   │   └── GameLoop.js            # ✅ Existing - Main loop
│   │
│   ├── Components/                 # ✅ Existing
│   │   ├── Position.js
│   │   ├── Movement.js
│   │   ├── AI.js
│   │   ├── Combat.js
│   │   ├── Economy.js
│   │   ├── Inventory.js
│   │   ├── Worker.js
│   │   ├── Player.js
│   │   ├── Village.js
│   │   └── ...
│   │
│   ├── Systems/                    # ✅ Existing (extend)
│   │   ├── AISystem.js            # ✅ Existing
│   │   ├── CombatSystem.js        # ✅ Existing
│   │   ├── EconomySystem.js       # ✅ Existing
│   │   ├── InteractionSystem.js   # ✅ Existing
│   │   ├── MovementSystem.js      # ✅ Existing
│   │   ├── WorkerSystem.js        # ✅ Existing
│   │   │
│   │   ├── TravelSystem.js        # 🆕 NEW - Travel management
│   │   ├── WeatherSystem.js       # 🆕 NEW - Weather simulation
│   │   ├── EncounterSystem.js     # 🆕 NEW - Random encounters
│   │   └── WorldSimulationSystem.js # 🆕 NEW - Background world
│   │
│   ├── World/                      # 🆕 NEW FOLDER
│   │   ├── DataModels.js          # 🆕 MapNode, RouteEdge, etc
│   │   ├── WorldGraph.js          # 🆕 Graph management (ALREADY IN Architecture)
│   │   ├── RouteCalculator.js     # 🆕 Pathfinding (ALREADY IN Architecture)
│   │   ├── RegionManager.js       # 🆕 LOD & performance
│   │   ├── WorldBuilder.js        # 🆕 Procedural world generation
│   │   ├── SettlementPlacer.js    # 🆕 Settlement placement logic
│   │   └── TerrainGenerator.js    # 🆕 Terrain patch generation
│   │
│   └── Entities/                   # ✅ Existing
│       ├── Player.js
│       ├── NPC.js
│       ├── Village.js
│       ├── Farm.js
│       └── Building.js
│
├── Render/                         # ✅ Existing
│   ├── SceneManager.js
│   ├── WorldRenderer.js           # 🔄 MODIFY - Add travel visualization
│   ├── EntityRenderer.js
│   └── UIRenderer.js
│
└── UI/                             # ✅ Existing
    ├── UIManager.js
    ├── EconomyPanel.js
    ├── InventoryPanel.js
    ├── InteractionMenu.js
    │
    ├── WorldMapPanel.js           # 🆕 NEW - Strategic map view
    ├── TravelPanel.js             # 🆕 NEW - Travel UI
    └── RouteSelector.js           # 🆕 NEW - Route selection UI

IMPLEMENTATION PRIORITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1: CORE DATA & GRAPH (Week 1)
├── Engine/World/DataModels.js          ✅ DONE (provided above)
├── Engine/World/WorldGraph.js          ✅ DONE (in Architecture)
├── Engine/World/RouteCalculator.js     ✅ DONE (in Architecture)
└── Engine/World/RegionManager.js       ⏳ NEXT

Phase 2: WORLD GENERATION (Week 2)
├── Engine/World/TerrainGenerator.js    ⏳ NEXT
├── Engine/World/SettlementPlacer.js    ⏳ NEXT
└── Engine/World/WorldBuilder.js        ⏳ NEXT

Phase 3: TRAVEL MECHANICS (Week 3)
├── Engine/Systems/TravelSystem.js      ⏳ NEXT
├── Engine/Systems/WeatherSystem.js     ⏳ NEXT
└── Engine/Systems/EncounterSystem.js   ⏳ NEXT

Phase 4: WORLD SIMULATION (Week 4)
├── Engine/Systems/WorldSimulationSystem.js  ⏳ NEXT
└── Performance optimization

Phase 5: UI & INTEGRATION (Week 5)
├── UI/WorldMapPanel.js
├── UI/TravelPanel.js
├── UI/RouteSelector.js
└── Render/WorldRenderer.js updates

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTEGRATION WITH EXISTING SYSTEMS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TimeSystem.js:
- Add weather transition hooks
- Add seasonal travel modifiers
- Add day/night travel risk

MovementSystem.js:
- Integrate with TravelState
- Switch between local movement and travel movement
- Handle terrain speed modifiers

InteractionSystem.js:
- Add "Start Travel" interaction
- Add "Camp" interaction
- Add settlement entry/exit

AISystem.js:
- Add NPC travel AI state
- Caravan movement
- Patrol routes

EconomySystem.js:
- Trade routes affect prices
- Settlement prosperity affects economy
- Travel costs (food, maintenance)

MEVCUT YAPIYI KIRMADAN ENTEGRASYON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. TimeSystem - EXTEND (not replace)
   - Add weatherState property
   - Add seasonalEffects getter
   - Add travelTimeScale property

2. MovementSystem - EXTEND
   - Check if entity has TravelState component
   - If traveling: use travel movement logic
   - If local: use existing movement logic

3. InteractionSystem - ADD NEW ACTIONS
   - Existing village interaction: ADD "Plan Travel" option
   - Add new interaction types: 'camp', 'continue_travel', 'abort_travel'

4. Player Component - ADD TRAVEL DATA
   - Add travelState: TravelState | null
   - Add discoveredNodes: Set<nodeId>
   - Add visitedRegions: Set<regionId>

5. World Rendering - LAYER APPROACH
   - Layer 1 (existing): Local 3D world
   - Layer 2 (new): Strategic map overlay (toggle with M key)
   - Layer 3 (new): Travel path visualization
   - Layer 4 (new): Fog of war

SAVE/LOAD INTEGRATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SaveGame structure:
{
  player: { ... },
  entities: [ ... ],
  world: {
    nodes: [ ... ],
    edges: [ ... ],
    regions: [ ... ],
    terrainPatches: [ ... ],
  },
  travelState: { ... },
  weatherState: { ... },
  discoveredNodes: [ ... ],
  visitedRegions: [ ... ],
  worldSimulation: {
    caravans: [ ... ],
    patrols: [ ... ],
    banditPressure: { ... },
  }
}