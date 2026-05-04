/**
 * Sandbox RPG UI System
 * Handles all UI components for the interaction system
 */

class SandboxRPGUI {
  constructor() {
    this.isInitialized = false;
    this.activeModal = null;
    this.activeDialogue = null;
    
    // UI Elements
    this.interactionMenu = null;
    this.playerStats = null;
    this.economyPanel = null;
    this.workerStatus = null;
    this.farmModal = null;
    this.npcDialogue = null;
    
    this.init();
  }
  
  init() {
    if (this.isInitialized) return;
    
    console.log('🎨 Initializing Sandbox RPG UI...');
    
    this.createUIElements();
    this.setupEventListeners();
    this.loadStyles();
    
    this.isInitialized = true;
    console.log('✅ Sandbox RPG UI initialized!');
  }
  
  createUIElements() {
    // Create interaction menu
    this.interactionMenu = this.createElement('div', {
      id: 'interaction-menu',
      className: 'interaction-menu',
      innerHTML: '<div class="no-interactions">No nearby interactions</div>'
    });
    
    // Create player stats panel
    this.playerStats = this.createElement('div', {
      id: 'player-stats',
      className: 'player-stats',
      innerHTML: `
        <div class="gold">💰 Gold: <span id="gold-amount">100</span></div>
        <div class="level">⭐ Level: <span id="level-amount">1</span></div>
        <div class="health">❤️ Health: <span id="health-amount">100/100</span></div>
      `
    });
    
    // Create economy panel
    this.economyPanel = this.createElement('div', {
      id: 'economy-panel',
      className: 'economy-panel collapsed',
      innerHTML: `
        <h3>📊 Economy</h3>
        <div>🏡 Farms: <span id="farm-count">0/0</span></div>
        <div>👷 Workers: <span id="worker-count">0/0</span></div>
        <div>💵 Wages: <span id="wage-amount">0.0</span>/sec</div>
        <div class="production-list" id="production-list"></div>
      `
    });
    
    // Create inventory panel - compatible with economy system
    this.inventoryPanel = this.createElement('div', {
      id: 'inventory-panel',
      className: 'inventory-panel collapsed',
      innerHTML: `
        <h3>🎒 Envanter</h3>
        <div class="inventory-grid">
          <div class="inventory-item">
            <span class="item-icon">🌾</span>
            <span class="item-name">Tahıl</span>
            <span class="item-count" id="inv-food">0</span>
          </div>
          <div class="inventory-item">
            <span class="item-icon">🥩</span>
            <span class="item-name">Et</span>
            <span class="item-count" id="inv-meat">0</span>
          </div>
          <div class="inventory-item">
            <span class="item-icon">🐂</span>
            <span class="item-name">Deri</span>
            <span class="item-count" id="inv-leather">0</span>
          </div>
          <div class="inventory-item">
            <span class="item-icon">⚒️</span>
            <span class="item-name">Demir</span>
            <span class="item-count" id="inv-iron">0</span>
          </div>
          <div class="inventory-item">
            <span class="item-icon">🪵</span>
            <span class="item-name">Odun</span>
            <span class="item-count" id="inv-wood">0</span>
          </div>
          <div class="inventory-item">
            <span class="item-icon">⚔️</span>
            <span class="item-name">Silah</span>
            <span class="item-count" id="inv-weapon">0</span>
          </div>
          <div class="inventory-item">
            <span class="item-icon">🛡️</span>
            <span class="item-name">Zırh</span>
            <span class="item-count" id="inv-armor">0</span>
          </div>
        </div>
        <div class="inventory-stats">
          <div>Kapasite: <span id="inv-capacity">0/50</span></div>
        </div>
      `
    });
    
        
        
    // Create worker status panel
    this.workerStatus = this.createElement('div', {
      id: 'worker-status',
      className: 'worker-status',
      innerHTML: `
        <h4>👷 Workers</h4>
        <div id="worker-list"></div>
      `
    });
    
    // Create farm management modal
    this.farmModal = this.createElement('div', {
      id: 'farm-management-modal',
      className: 'farm-management-modal',
      innerHTML: `
        <div class="modal-content">
          <h2>🏡 Farm Management</h2>
          <div id="farm-details"></div>
          <div id="farm-actions"></div>
        </div>
      `
    });
    
    // Create NPC dialogue box
    this.npcDialogue = this.createElement('div', {
      id: 'npc-dialogue',
      className: 'npc-dialogue',
      innerHTML: `
        <div class="npc-name" id="npc-name"></div>
        <div class="npc-text" id="npc-text"></div>
        <div class="dialogue-options" id="dialogue-options"></div>
      `
    });
    
    // Add all elements to body
    document.body.appendChild(this.playerStats);
    document.body.appendChild(this.economyPanel);
    document.body.appendChild(this.inventoryPanel);
    document.body.appendChild(this.workerStatus);
    document.body.appendChild(this.interactionMenu);
    document.body.appendChild(this.farmModal);
    document.body.appendChild(this.npcDialogue);
  }
  
  createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.id) element.id = options.id;
    if (options.className) element.className = options.className;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    if (options.style) Object.assign(element.style, options.style);
    
    return element;
  }
  
  setupEventListeners() {
    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
    
    // Close modals on outside click
    this.farmModal.addEventListener('click', (e) => {
      if (e.target === this.farmModal) {
        this.closeFarmModal();
      }
    });
    
    this.npcDialogue.addEventListener('click', (e) => {
      if (e.target === this.npcDialogue) {
        this.closeDialogue();
      }
    });
    
    // Handle interaction button clicks
    this.interactionMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('interaction-btn')) {
        const action = e.target.dataset.action;
        const entityId = e.target.closest('.interaction-item').dataset.entityId;
        this.handleInteractionClick(entityId, action);
      }
    });
  }
  
  loadStyles() {
    if (document.getElementById('sandbox-rpg-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'sandbox-rpg-styles';
    link.rel = 'stylesheet';
    link.href = 'styles/sandbox-rpg.css';
    document.head.appendChild(link);
  }
  
  // Update methods
  updateInteractionMenu(interactions) {
    if (!interactions || interactions.length === 0) {
      this.interactionMenu.innerHTML = '<div class="no-interactions">No nearby interactions</div>';
      this.interactionMenu.style.display = 'none';
      return;
    }
    
    let html = '';
    for (const interaction of interactions) {
      html += `
        <div class="interaction-item" data-entity-id="${interaction.entity.id}">
          <div class="interaction-title">${this.getEntityDisplayName(interaction)}</div>
          <div class="interaction-distance">Distance: ${interaction.distance.toFixed(1)}m</div>
          <div class="interaction-actions">
      `;
      
      for (const action of interaction.actions) {
        html += `
          <button class="interaction-btn" data-action="${action}">
            ${this.getActionDisplayName(action)}
          </button>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    this.interactionMenu.innerHTML = html;
    this.interactionMenu.style.display = 'block';
  }
  
  updatePlayerStats(player) {
    if (!player) return;
    
    const inventory = player.getComponent('inventory');
    const character = player.getComponent('character');
    
    if (inventory) {
      const goldElement = document.getElementById('gold-amount');
      if (goldElement) goldElement.textContent = inventory.gold || 0;
    }
    
    if (character) {
      const levelElement = document.getElementById('level-amount');
      const healthElement = document.getElementById('health-amount');
      
      if (levelElement) levelElement.textContent = character.level || 1;
      if (healthElement) healthElement.textContent = `${character.health || 100}/${character.maxHealth || 100}`;
    }
  }
  
  updateEconomyPanel(systemStats) {
    if (!systemStats) return;
    
    const farmStats = systemStats.farms;
    const workerStats = systemStats.workers;
    
    // Update farm count
    const farmCountElement = document.getElementById('farm-count');
    if (farmCountElement) {
      farmCountElement.textContent = `${farmStats.ownedFarms}/${farmStats.totalFarms}`;
    }
    
    // Update worker count
    const workerCountElement = document.getElementById('worker-count');
    if (workerCountElement) {
      const activeWorkers = workerStats.total - workerStats.unemployed;
      workerCountElement.textContent = `${activeWorkers}/${workerStats.total}`;
    }
    
    // Update wages
    const wageElement = document.getElementById('wage-amount');
    if (wageElement) {
      wageElement.textContent = workerStats.totalWages.toFixed(2);
    }
    
    // Update production list
    const productionList = document.getElementById('production-list');
    if (productionList && farmStats.totalProduction) {
      let productionHtml = '<div style="margin-top: 10px; font-weight: bold;">📈 Production:</div>';
      for (const [resource, rate] of Object.entries(farmStats.totalProduction)) {
        productionHtml += `<div class="production-item">${resource}: ${rate.toFixed(2)}/sec</div>`;
      }
      productionList.innerHTML = productionHtml;
    }
  }
  
  updateWorkerStatus(workers) {
    const workerList = document.getElementById('worker-list');
    if (!workerList) return;
    
    if (!workers || workers.length === 0) {
      workerList.innerHTML = '<div style="color: #999;">No workers</div>';
      return;
    }
    
    let html = '';
    for (const worker of workers.slice(0, 5)) { // Show max 5 workers
      const status = worker.getStatus();
      html += `
        <div class="worker-item">
          <span class="worker-profession">${worker.profession}</span>
          <span class="worker-task">${status.task}</span>
        </div>
      `;
    }
    
    if (workers.length > 5) {
      html += `<div style="color: #999; font-size: 11px;">...and ${workers.length - 5} more</div>`;
    }
    
    workerList.innerHTML = html;
  }
  
  // Modal methods
  showFarmManagement(farm) {
    const status = farm.getStatus();
    
    const detailsHtml = `
      <div><strong>Level:</strong> ${status.level}</div>
      <div><strong>Size:</strong> ${status.size} units</div>
      <div><strong>Workers:</strong> ${status.currentWorkers}/${status.maxWorkers}</div>
      <div><strong>Fertility:</strong> ${(status.fertility * 100).toFixed(0)}%</div>
      <div><strong>Soil Quality:</strong> ${(status.soilQuality * 100).toFixed(0)}%</div>
      <div style="margin-top: 10px;"><strong>Storage:</strong></div>
      ${Object.entries(status.storage).map(([res, amount]) => 
        `<div class="storage-item">${res}: ${amount.toFixed(1)}</div>`
      ).join('')}
      <div style="margin-top: 10px;"><strong>Production:</strong></div>
      ${Object.entries(status.production).map(([res, rate]) => 
        `<div class="production-item">${res}: ${rate.toFixed(2)}/sec</div>`
      ).join('')}
    `;
    
    const actionsHtml = `
      <button onclick="game.sandboxRPG.harvestFarm('${farm.id}')">🌾 Harvest</button>
      ${status.canExpand ? 
        `<button onclick="game.sandboxRPG.expandFarm('${farm.id}')">📏 Expand (${status.expansionCost}g)</button>` : 
        '<button disabled>📏 Max Level</button>'
      }
      <button onclick="game.sandboxRPG.hireWorkerForFarm('${farm.id}')">👷 Hire Worker</button>
      <button onclick="this.closest('.farm-management-modal').style.display='none'">Close</button>
    `;
    
    document.getElementById('farm-details').innerHTML = detailsHtml;
    document.getElementById('farm-actions').innerHTML = actionsHtml;
    
    this.farmModal.style.display = 'block';
    this.activeModal = 'farm';
  }
  
  closeFarmModal() {
    this.farmModal.style.display = 'none';
    this.activeModal = null;
  }
  
  showNPCDialogue(npc, dialogueText) {
    const behavior = npc.getComponent('behavior');
    const role = behavior?.role || 'NPC';
    
    document.getElementById('npc-name').textContent = `${role.charAt(0).toUpperCase() + role.slice(1)}`;
    document.getElementById('npc-text').textContent = dialogueText;
    
    // Add dialogue options
    const options = this.getNPCDialogueOptions(npc);
    let optionsHtml = '';
    
    for (const option of options) {
      optionsHtml += `
        <div class="dialogue-option" onclick="sandboxUI.handleNPCDialogueOption('${option.id}', '${npc.id}')">
          ${option.text}
        </div>
      `;
    }
    
    document.getElementById('dialogue-options').innerHTML = optionsHtml;
    this.npcDialogue.style.display = 'block';
    this.activeDialogue = npc.id;
  }
  
  closeDialogue() {
    this.npcDialogue.style.display = 'none';
    this.activeDialogue = null;
  }
  
  closeAllModals() {
    this.closeFarmModal();
    this.closeDialogue();
  }
  
  // Helper methods
  getEntityDisplayName(interaction) {
    const entity = interaction.entity;
    const behavior = entity.getComponent('behavior');
    
    switch (entity.type) {
      case 'npc':
        return behavior?.role ? behavior.role.charAt(0).toUpperCase() + behavior.role.slice(1) : 'NPC';
      case 'farm':
        return '🏡 Farm';
      case 'building':
        return behavior?.buildingType || 'Building';
      case 'worker':
        return behavior?.profession || 'Worker';
      default:
        return entity.type.charAt(0).toUpperCase() + entity.type.slice(1);
    }
  }
  
  getActionDisplayName(action) {
    const actionNames = {
      'talk': '💬 Talk',
      'hire': '👥 Hire',
      'trade': '💰 Trade',
      'work': '🔨 Work',
      'buy': '🛒 Buy',
      'sell': '💵 Sell',
      'expand': '📏 Expand',
      'craft': '⚒️ Craft',
      'repair': '🔧 Repair',
      'enter': '🚪 Enter',
      'attack': '⚔️ Attack',
      'defend': '🛡️ Defend',
      'manage': '⚙️ Manage'
    };
    
    return actionNames[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }
  
  getNPCDialogueOptions(npc) {
    const behavior = npc.getComponent('behavior');
    const role = behavior?.role || 'npc';
    
    const options = {
      farmer: [
        { id: 'talk_work', text: 'How is the farming going?' },
        { id: 'talk_weather', text: 'What do you think about the weather?' },
        { id: 'hire', text: 'Would you like to work for me?' },
        { id: 'goodbye', text: 'Goodbye' }
      ],
      guard: [
        { id: 'talk_patrol', text: 'How is the patrol going?' },
        { id: 'talk_village', text: 'Is the village safe?' },
        { id: 'hire', text: 'I need a guard' },
        { id: 'goodbye', text: 'Goodbye' }
      ],
      trader: [
        { id: 'talk_goods', text: 'What goods do you have?' },
        { id: 'talk_prices', text: 'What are the current prices?' },
        { id: 'trade', text: 'Let\'s trade' },
        { id: 'goodbye', text: 'Goodbye' }
      ],
      worker: [
        { id: 'talk_job', text: 'How is your work?' },
        { id: 'talk_skills', text: 'What skills do you have?' },
        { id: 'hire', text: 'I want to hire you' },
        { id: 'goodbye', text: 'Goodbye' }
      ]
    };
    
    return options[role] || options.npc;
  }
  
  handleInteractionClick(entityId, action) {
    console.log(`🎮 Interaction clicked: ${action} on ${entityId}`);
    
    // Emit interaction event
    const event = new CustomEvent('uiInteraction', {
      detail: { entityId, action }
    });
    document.dispatchEvent(event);
  }
  
  handleNPCDialogueOption(optionId, npcId) {
    console.log(`💬 NPC dialogue option: ${optionId} for ${npcId}`);
    
    // Handle different dialogue options
    switch (optionId) {
      case 'talk_work':
      case 'talk_patrol':
      case 'talk_goods':
        this.showNPCResponse(npcId, 'Everything is going well, thank you for asking!');
        break;
      case 'talk_weather':
        this.showNPCResponse(npcId, 'The weather has been good for farming this season.');
        break;
      case 'talk_village':
        this.showNPCResponse(npcId, 'The village is peaceful under our protection.');
        break;
      case 'talk_prices':
        this.showNPCResponse(npcId, 'Prices are fair, though they change with the seasons.');
        break;
      case 'talk_job':
        this.showNPCResponse(npcId, 'I enjoy my work. It keeps me busy and productive.');
        break;
      case 'talk_skills':
        this.showNPCResponse(npcId, 'I have experience in farming and basic labor.');
        break;
      case 'hire':
        this.initiateHireProcess(npcId);
        break;
      case 'trade':
        this.initiateTrade(npcId);
        break;
      case 'goodbye':
        this.closeDialogue();
        break;
    }
  }
  
  showNPCResponse(npcId, response) {
    const npcText = document.getElementById('npc-text');
    if (npcText) {
      npcText.textContent = response;
    }
  }
  
  initiateHireProcess(npcId) {
    console.log(`👷 Initiating hire process for ${npcId}`);
    
    // Emit hire event
    const event = new CustomEvent('hireNPC', {
      detail: { npcId }
    });
    document.dispatchEvent(event);
    
    this.closeDialogue();
  }
  
  initiateTrade(npcId) {
    console.log(`💰 Initiating trade with ${npcId}`);
    
    // Emit trade event
    const event = new CustomEvent('tradeWithNPC', {
      detail: { npcId }
    });
    document.dispatchEvent(event);
    
    this.closeDialogue();
  }
}

// Create global instance
window.sandboxUI = new SandboxRPGUI();
