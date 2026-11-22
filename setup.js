var setupFlow = document.getElementById('setup-flow');
var mapStep = document.getElementById('map-step');
var lineupStep = document.getElementById('lineup-step');
var mapCards = document.getElementById('map-cards');
var mapSearch = document.getElementById('map-search');
var mapCount = document.getElementById('map-count');
var mapPreviewImage = document.getElementById('map-preview-image');
var selectedMapTitle = document.getElementById('selected-map-title');
var mapFloorSelect = document.getElementById('map-floor');
var continueToLineup = document.getElementById('continue-to-lineup');
var operatorPicker = document.getElementById('operator-picker');
var operatorSearch = document.getElementById('operator-search');
var operatorOptions = document.getElementById('operator-options');
var operatorSlots = document.getElementById('operator-slots');
var banSlots = document.getElementById('ban-slots');
var lineupStatus = document.getElementById('lineup-status');
var banStatus = document.getElementById('ban-status');
var enterEditorButton = document.getElementById('enter-editor');
var editorMapControls = document.getElementById('editor-map-controls');
var editorFloorSelect = document.getElementById('editor-floor-select');
var editorMapMenu = document.getElementById('editor-map-menu');
var toggleEditorMapMenu = document.getElementById('toggle-editor-map-menu');
var editorBanList = document.getElementById('editor-ban-list');
var playerPanels = document.getElementById('player-panels');

var selectedMap = null;
var selectedFloor = null;
var selectedSide = null;
var selectedOperators = Array(5).fill(null);
var selectedBackups = Array(5).fill(null);
var playerNames = Array(5).fill('');
var showPlayerNamesOnMap = Array(5).fill(true);
var predefinedPlayerNames = ['K4ioSB.LGS', 'Shira.LGS', 'Danguera.LGS', 'iRafzM.LGS', 'NoTBaaD.LGS'];
var selectedBans = Array(3).fill(null);
var activeOperatorSlot = -1;
var activeBanSlot = -1;
var operatorPickerMode = 'lineup';

function getMapOptions() {
    return Array.from(document.querySelectorAll('.conteinerMapas .mapa')).map(function(item) {
        var title = item.querySelector('.nomeMapa').textContent.trim();
        var image = item.querySelector('.mapaOpcao').getAttribute('src');
        var floors = Array.from(item.querySelectorAll('.andares button')).map(function(button) {
            var match = button.getAttribute('onclick').match(/changeBackground\('([^']+)', '([^']+)'\)/);
            if (!match) return null;
            return {
                label: button.textContent.trim(),
                path: match[1],
                fileName: match[2]
            };
        }).filter(Boolean);

        return { title: title, image: image, floors: floors };
    });
}

var mapOptions = getMapOptions();
var operatorPools = {
    attack: Array.from(document.querySelectorAll('.barra > .icons:first-child .atq .icon')).map(function(icon) {
        return {
            id: icon.id,
            name: formatOperatorName(icon.id),
            image: icon.getAttribute('data-src')
        };
    }),
    defense: Array.from(document.querySelectorAll('.barra > .icons:first-child .def .icon')).map(function(icon) {
        return {
            id: icon.id,
            name: formatOperatorName(icon.id),
            image: icon.getAttribute('data-src')
        };
    })
};

function formatOperatorName(id) {
    return id.trim().replace(/[-_]/g, ' ').replace(/\b[a-z]/g, function(letter) {
        return letter.toUpperCase();
    });
}

function renderMapCards(filter) {
    var normalizedFilter = filter.trim().toLocaleLowerCase();
    var visibleMaps = mapOptions.filter(function(map) {
        return map.title.toLocaleLowerCase().indexOf(normalizedFilter) !== -1;
    });

    mapCount.textContent = visibleMaps.length + (visibleMaps.length === 1 ? ' mapa' : ' mapas');
    mapCards.textContent = '';
    visibleMaps.forEach(function(map) {
        var card = document.createElement('button');
        var image = document.createElement('img');
        var title = document.createElement('span');

        card.className = 'map-card';
        card.type = 'button';
        card.setAttribute('role', 'option');
        card.setAttribute('aria-selected', String(selectedMap === map));
        image.src = map.image;
        image.alt = '';
        image.loading = 'lazy';
        title.textContent = map.title;
        card.appendChild(image);
        card.appendChild(title);
        card.addEventListener('click', function() {
            selectMap(map);
        });
        mapCards.appendChild(card);
    });
}

function selectMap(map) {
    if (selectedMap !== map) {
        selectedSide = null;
        selectedOperators = Array(5).fill(null);
        document.querySelectorAll('.side-option').forEach(function(button) {
            button.setAttribute('aria-pressed', 'false');
        });
        renderOperatorSlots();
        renderBanSlots();
    }

    selectedMap = map;
    selectedFloor = map.floors.find(function(floor) {
        return floor.label.toLocaleLowerCase() === 'térreo';
    }) || map.floors[0];

    selectedMapTitle.textContent = map.title;
    mapPreviewImage.src = map.image;
    mapPreviewImage.alt = map.title;
    mapPreviewImage.hidden = false;
    mapFloorSelect.textContent = '';
    map.floors.forEach(function(floor) {
        var option = document.createElement('option');
        option.value = floor.fileName;
        option.textContent = floor.label;
        mapFloorSelect.appendChild(option);
    });
    mapFloorSelect.value = selectedFloor.fileName;
    mapFloorSelect.disabled = false;
    continueToLineup.disabled = false;
    renderMapCards(mapSearch.value);
}

mapSearch.addEventListener('input', function() {
    renderMapCards(mapSearch.value);
});

mapFloorSelect.addEventListener('change', function() {
    if (!selectedMap) return;
    selectedFloor = selectedMap.floors.find(function(floor) {
        return floor.fileName === mapFloorSelect.value;
    });
});

continueToLineup.addEventListener('click', function() {
    if (!selectedMap || !selectedFloor) return;
    document.getElementById('lineup-map-summary').textContent =
        selectedMap.title + ' - ' + selectedFloor.label;
    document.getElementById('lineup-backdrop').style.backgroundImage =
        'linear-gradient(rgba(7, 11, 15, 0.58), rgba(7, 11, 15, 0.78)), url("' + selectedMap.image + '")';
    mapStep.hidden = true;
    lineupStep.hidden = false;
});

document.getElementById('back-to-map').addEventListener('click', function() {
    lineupStep.hidden = true;
    mapStep.hidden = false;
});

document.querySelectorAll('.side-option').forEach(function(button) {
    button.addEventListener('click', function() {
        var side = button.getAttribute('data-side');
        if (selectedSide !== side) {
            selectedSide = side;
            selectedOperators = Array(5).fill(null);
        }
        document.querySelectorAll('.side-option').forEach(function(option) {
            option.setAttribute('aria-pressed', String(option === button));
        });
        renderOperatorSlots();
        renderBanSlots();
    });
});

function updateLineupStatus() {
    var selectedOperatorCount = selectedOperators.filter(Boolean).length;
    var selectedBanCount = selectedBans.filter(Boolean).length;
    var duplicatePlayerName = getDuplicatePredefinedPlayerName();
    banStatus.textContent = selectedSide
        ? selectedBanCount + ' de 3 operadores banidos.'
        : 'Selecione o lado para escolher os banimentos.';
    lineupStatus.textContent = duplicatePlayerName
        ? 'Cada nome predefinido só pode ser usado uma vez.'
        : selectedSide
            ? selectedOperatorCount + ' de 5 operadores selecionados.'
            : 'Selecione o lado para começar.';
    enterEditorButton.disabled = !selectedSide ||
        Boolean(duplicatePlayerName);
}

function getDuplicatePredefinedPlayerName() {
    return predefinedPlayerNames.find(function(predefinedName) {
        var normalizedName = predefinedName.toLocaleLowerCase();
        return playerNames.filter(function(playerName) {
            return playerName.trim().toLocaleLowerCase() === normalizedName;
        }).length > 1;
    });
}

function updatePlayerNameOptions() {
    operatorSlots.querySelectorAll('.lineup-player-preset').forEach(function(select, index) {
        Array.from(select.options).forEach(function(option) {
            if (!option.value) return;
            var normalizedName = option.value.toLocaleLowerCase();
            option.disabled = playerNames.some(function(playerName, playerIndex) {
                return playerIndex !== index &&
                    playerName.trim().toLocaleLowerCase() === normalizedName;
            });
        });
    });
}

function openOperatorPicker(mode, slotIndex) {
    operatorPickerMode = mode;
    activeOperatorSlot = mode === 'ban' ? -1 : slotIndex;
    activeBanSlot = mode === 'ban' ? slotIndex : -1;
    operatorSearch.value = '';
    document.getElementById('operator-picker-description').textContent =
        mode === 'ban' ? 'Escolha um operador para banir' :
            mode === 'backup' ? 'Escolha um operador reserva para este jogador' :
                mode === 'swap' ? 'Escolha o novo operador deste jogador' :
                    'Escolha um operador para a posição';
    document.getElementById('operator-picker-title').textContent =
        mode === 'ban' ? 'Banir operador' :
            mode === 'backup' ? 'Operador reserva' :
                mode === 'swap' ? 'Trocar operador' : 'Operadores';
    renderOperatorOptions();
    operatorPicker.hidden = false;
    operatorSearch.focus();
}

function renderOperatorSlots() {
    operatorSlots.textContent = '';
    selectedOperators.forEach(function(operatorId, index) {
        var playerSlot = document.createElement('div');
        var slot = document.createElement('button');
        var nameLabel = document.createElement('label');
        var nameField = document.createElement('div');
        var nameSelect = document.createElement('select');
        var nameInput = document.createElement('input');
        playerSlot.className = 'lineup-player-slot';
        slot.className = 'operator-slot';
        slot.type = 'button';
        slot.disabled = !selectedSide;
        slot.setAttribute('aria-label', 'Escolher operador ' + (index + 1));

        if (operatorId && selectedSide) {
            var operator = operatorPools[selectedSide].find(function(item) {
                return item.id === operatorId;
            });
            var image = document.createElement('img');
            var name = document.createElement('span');
            image.src = operator.image;
            image.alt = '';
            name.textContent = operator.name;
            slot.appendChild(image);
            slot.appendChild(name);
        } else {
            var plus = document.createElement('span');
            plus.className = 'slot-plus';
            plus.textContent = '+';
            var label = document.createElement('span');
            label.textContent = 'Escolher';
            slot.appendChild(plus);
            slot.appendChild(label);
        }

        slot.addEventListener('click', function() {
            openOperatorPicker('lineup', index);
        });
        nameField.className = 'lineup-player-name';
        nameLabel.htmlFor = 'lineup-player-name-' + (index + 1);
        nameLabel.textContent = 'Jogador ' + (index + 1);
        nameSelect.className = 'lineup-player-preset';
        nameSelect.setAttribute('aria-label', 'Selecionar nome predefinido para Jogador ' + (index + 1));
        var emptyNameOption = document.createElement('option');
        emptyNameOption.value = '';
        emptyNameOption.textContent = 'Selecionar nome...';
        nameSelect.appendChild(emptyNameOption);
        predefinedPlayerNames.forEach(function(playerName) {
            var option = document.createElement('option');
            option.value = playerName;
            option.textContent = playerName;
            nameSelect.appendChild(option);
        });
        nameSelect.value = predefinedPlayerNames.indexOf(playerNames[index].trim()) === -1
            ? ''
            : playerNames[index].trim();
        nameInput.id = 'lineup-player-name-' + (index + 1);
        nameInput.type = 'text';
        nameInput.maxLength = 40;
        nameInput.placeholder = 'Nome do jogador';
        nameInput.disabled = !operatorId;
        nameInput.value = playerNames[index];
        nameSelect.disabled = !operatorId;
        nameSelect.addEventListener('change', function() {
            playerNames[index] = nameSelect.value;
            nameInput.value = nameSelect.value;
            updatePlayerNameOptions();
            updateLineupStatus();
        });
        nameInput.addEventListener('input', function() {
            playerNames[index] = nameInput.value;
            var trimmedName = nameInput.value.trim();
            nameSelect.value = predefinedPlayerNames.indexOf(trimmedName) === -1 ? '' : trimmedName;
            updatePlayerNameOptions();
            updateLineupStatus();
        });
        nameField.appendChild(nameLabel);
        nameField.appendChild(nameSelect);
        nameField.appendChild(nameInput);
        playerSlot.appendChild(slot);
        playerSlot.appendChild(nameField);
        operatorSlots.appendChild(playerSlot);
    });

    updatePlayerNameOptions();
    updateLineupStatus();
}

function renderBanSlots() {
    banSlots.textContent = '';
    selectedBans.forEach(function(operatorId, index) {
        var slot = document.createElement('button');
        slot.className = 'ban-slot';
        slot.type = 'button';
        slot.disabled = !selectedSide;
        slot.setAttribute('aria-label', 'Escolher operador banido ' + (index + 1));

        if (operatorId) {
            var operator = operatorPools.attack.concat(operatorPools.defense).find(function(item) {
                return item.id === operatorId;
            });
            var image = document.createElement('img');
            var name = document.createElement('span');
            image.src = operator.image;
            image.alt = '';
            name.textContent = operator.name;
            slot.appendChild(image);
            slot.appendChild(name);
        } else {
            var plus = document.createElement('span');
            plus.className = 'slot-plus';
            plus.textContent = '+ Banir';
            slot.appendChild(plus);
        }

        slot.addEventListener('click', function() {
            openOperatorPicker('ban', index);
        });
        banSlots.appendChild(slot);
    });

    updateLineupStatus();
}

function renderOperatorOptions() {
    var filter = operatorSearch.value.trim().toLocaleLowerCase();
    var selectedPool = operatorPickerMode === 'ban'
        ? operatorPools.attack.concat(operatorPools.defense)
        : operatorPools[selectedSide] || [];
    operatorOptions.textContent = '';
    selectedPool.filter(function(operator) {
        return operator.name.toLocaleLowerCase().indexOf(filter) !== -1;
    }).forEach(function(operator) {
        var choice = document.createElement('button');
        var image = document.createElement('img');
        var name = document.createElement('span');
        var isSelected;
        var alreadyUsed;

        if (operatorPickerMode === 'ban') {
            isSelected = selectedBans[activeBanSlot] === operator.id;
            alreadyUsed = selectedOperators.indexOf(operator.id) !== -1 ||
                selectedBans.some(function(id, index) {
                    return index !== activeBanSlot && id === operator.id;
                });
        } else if (operatorPickerMode === 'backup') {
            isSelected = selectedBackups[activeOperatorSlot] === operator.id;
            alreadyUsed = selectedBans.indexOf(operator.id) !== -1 ||
                selectedOperators.some(function(id, index) {
                    return index !== activeOperatorSlot && id === operator.id;
                }) ||
                selectedBackups.some(function(id, index) {
                    return index !== activeOperatorSlot && id === operator.id;
                }) ||
                selectedOperators[activeOperatorSlot] === operator.id;
        } else {
            isSelected = selectedOperators[activeOperatorSlot] === operator.id;
            alreadyUsed = selectedBans.indexOf(operator.id) !== -1 ||
                selectedOperators.some(function(id, index) {
                    return index !== activeOperatorSlot && id === operator.id;
                }) ||
                selectedBackups.some(function(id, index) {
                    return index !== activeOperatorSlot && id === operator.id;
                });
        }

        choice.className = 'operator-option';
        choice.type = 'button';
        choice.disabled = alreadyUsed;
        choice.setAttribute('aria-pressed', String(isSelected));
        image.src = operator.image;
        image.alt = '';
        name.textContent = operator.name;
        choice.appendChild(image);
        choice.appendChild(name);
        choice.addEventListener('click', function() {
            if (operatorPickerMode === 'ban') {
                selectedBans[activeBanSlot] = operator.id;
            } else if (operatorPickerMode === 'backup') {
                selectedBackups[activeOperatorSlot] = operator.id;
            } else if (operatorPickerMode === 'swap' &&
                selectedBackups[activeOperatorSlot] === operator.id) {
                selectedBackups[activeOperatorSlot] = selectedOperators[activeOperatorSlot];
                selectedOperators[activeOperatorSlot] = operator.id;
            } else {
                selectedOperators[activeOperatorSlot] = operator.id;
            }
            operatorPicker.hidden = true;
            renderOperatorSlots();
            renderBanSlots();
            if (setupFlow.hidden && operatorPickerMode !== 'ban') {
                renderPlayerPanels();
            }
        });
        operatorOptions.appendChild(choice);
    });
}

operatorSearch.addEventListener('input', renderOperatorOptions);
document.getElementById('close-operator-picker').addEventListener('click', function() {
    operatorPicker.hidden = true;
});
operatorPicker.addEventListener('click', function(event) {
    if (event.target.hasAttribute('data-close-picker')) {
        operatorPicker.hidden = true;
    }
});
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && !operatorPicker.hidden) {
        operatorPicker.hidden = true;
    }
});

function findOperatorById(operatorId) {
    return operatorPools.attack.concat(operatorPools.defense).find(function(operator) {
        return operator.id === operatorId;
    });
}

function renderEditorBanList() {
    editorBanList.textContent = '';
    selectedBans.forEach(function(operatorId) {
        if (!operatorId) return;
        var operator = findOperatorById(operatorId);
        var item = document.createElement('div');
        var image = document.createElement('img');
        var label = document.createElement('span');
        item.className = 'editor-ban-item';
        item.title = operator.name;
        image.src = operator.image;
        image.alt = operator.name;
        label.textContent = 'Ban';
        item.appendChild(image);
        item.appendChild(label);
        editorBanList.appendChild(item);
    });
    editorBanList.hidden = false;
}

function renderPlayerPanels() {
    playerPanels.textContent = '';
    selectedOperators.forEach(function(operatorId, index) {
        var operator = operatorId
            ? operatorPools[selectedSide].find(function(item) {
                return item.id === operatorId;
            })
            : null;
        var card = document.createElement('section');
        var heading = document.createElement('div');
        var playerLabel = document.createElement('span');
        var operatorName = document.createElement('span');
        var operatorTiles = document.createElement('div');
        var actions = document.createElement('div');
        var nameToggleLabel = document.createElement('label');
        var nameToggle = document.createElement('input');
        var swapButton = document.createElement('button');
        var backupButton = document.createElement('button');
        var backupOperator = selectedBackups[index]
            ? operatorPools[selectedSide].find(function(item) {
                return item.id === selectedBackups[index];
            })
            : null;

        card.className = 'player-card';
        heading.className = 'player-card-heading';
        playerLabel.textContent = playerNames[index].trim() || 'Jogador ' + (index + 1);
        operatorName.textContent = operator ? operator.name : 'Operador não selecionado';
        heading.appendChild(playerLabel);
        heading.appendChild(operatorName);
        operatorTiles.className = 'player-operator-tiles';
        if (operator) {
            operatorTiles.appendChild(createPlayerOperatorTile(operator, index, 'main'));
        } else {
            var operatorPlaceholder = document.createElement('div');
            var operatorPlaceholderIcon = document.createElement('span');
            var operatorPlaceholderLabel = document.createElement('span');
            operatorPlaceholder.className = 'player-backup-placeholder';
            operatorPlaceholder.setAttribute('aria-hidden', 'true');
            operatorPlaceholderIcon.textContent = '+';
            operatorPlaceholderLabel.textContent = 'Operador';
            operatorPlaceholder.appendChild(operatorPlaceholderIcon);
            operatorPlaceholder.appendChild(operatorPlaceholderLabel);
            operatorTiles.appendChild(operatorPlaceholder);
        }
        if (backupOperator) {
            operatorTiles.appendChild(createPlayerOperatorTile(backupOperator, index, 'backup'));
        } else {
            var backupPlaceholder = document.createElement('div');
            var placeholderIcon = document.createElement('span');
            var placeholderLabel = document.createElement('span');
            backupPlaceholder.className = 'player-backup-placeholder';
            backupPlaceholder.setAttribute('aria-hidden', 'true');
            placeholderIcon.textContent = '+';
            placeholderLabel.textContent = 'Reserva';
            backupPlaceholder.appendChild(placeholderIcon);
            backupPlaceholder.appendChild(placeholderLabel);
            operatorTiles.appendChild(backupPlaceholder);
        }
        actions.className = 'player-card-actions';
        if (playerNames[index].trim()) {
            nameToggleLabel.className = 'player-name-display-toggle';
            nameToggle.type = 'checkbox';
            nameToggle.checked = showPlayerNamesOnMap[index];
            nameToggle.addEventListener('change', function() {
                showPlayerNamesOnMap[index] = nameToggle.checked;
                var name = nameToggle.checked ? playerNames[index].trim() : '';
                card.querySelectorAll('.player-operator-tile').forEach(function(tile) {
                    tile.setAttribute('data-player-name', name);
                });
            });
            nameToggleLabel.appendChild(nameToggle);
            nameToggleLabel.appendChild(document.createTextNode('Mostrar nome no mapa'));
            actions.appendChild(nameToggleLabel);
        }
        swapButton.type = 'button';
        swapButton.textContent = operator ? 'Trocar operador' : 'Selecionar operador';
        swapButton.addEventListener('click', function() {
            openOperatorPicker('swap', index);
        });
        backupButton.type = 'button';
        backupButton.textContent = backupOperator
            ? 'Trocar reserva'
            : 'Selecionar reserva';
        backupButton.title = backupOperator
            ? 'Operador reserva: ' + backupOperator.name
            : 'Selecionar operador reserva';
        backupButton.addEventListener('click', function() {
            openOperatorPicker('backup', index);
        });
        actions.appendChild(swapButton);
        actions.appendChild(backupButton);
        card.appendChild(heading);
        card.appendChild(operatorTiles);
        card.appendChild(actions);
        playerPanels.appendChild(card);
    });
    playerPanels.hidden = false;
}

function createPlayerOperatorTile(operator, playerIndex, role) {
    var tile = document.createElement('div');
    var image = document.createElement('img');
    var name = document.createElement('span');
    tile.className = 'icon player-operator-tile';
    tile.id = 'player-' + role + '-' + (playerIndex + 1);
    tile.setAttribute('data-src', operator.image);
    tile.setAttribute(
        'data-player-name',
        showPlayerNamesOnMap[playerIndex] ? playerNames[playerIndex].trim() : ''
    );
    tile.setAttribute('draggable', 'true');
    tile.title = operator.name;
    image.src = operator.image;
    image.alt = operator.name;
    name.textContent = operator.name;
    tile.appendChild(image);
    tile.appendChild(name);
    return tile;
}

function renderEditorFloors() {
    editorFloorSelect.textContent = '';
    selectedMap.floors.forEach(function(floor) {
        var option = document.createElement('option');
        option.value = floor.fileName;
        option.textContent = floor.label;
        editorFloorSelect.appendChild(option);
    });
    editorFloorSelect.value = selectedFloor.fileName;
    toggleEditorMapMenu.title = selectedMap.title;
    toggleEditorMapMenu.textContent = selectedMap.title;
    toggleEditorMapMenu.setAttribute('aria-label', 'Trocar mapa: ' + selectedMap.title);
}

function renderEditorMapMenu() {
    editorMapMenu.textContent = '';
    mapOptions.forEach(function(map) {
        var button = document.createElement('button');
        var image = document.createElement('img');
        var title = document.createElement('span');
        button.type = 'button';
        image.src = map.image;
        image.alt = '';
        image.loading = 'lazy';
        title.textContent = map.title;
        button.appendChild(image);
        button.appendChild(title);
        button.addEventListener('click', function() {
            selectedMap = map;
            selectedFloor = map.floors.find(function(floor) {
                return floor.label.toLocaleLowerCase() === 'térreo';
            }) || map.floors[0];
            renderEditorFloors();
            editorMapMenu.hidden = true;
            toggleEditorMapMenu.setAttribute('aria-expanded', 'false');
            changeBackground(selectedFloor.path, selectedFloor.fileName);
            window.centerCanvasView();
        });
        editorMapMenu.appendChild(button);
    });
}

editorFloorSelect.addEventListener('change', function() {
    selectedFloor = selectedMap.floors.find(function(floor) {
        return floor.fileName === editorFloorSelect.value;
    });
    if (selectedFloor) {
        changeBackground(selectedFloor.path, selectedFloor.fileName);
    }
});

toggleEditorMapMenu.addEventListener('click', function() {
    editorMapMenu.hidden = !editorMapMenu.hidden;
    toggleEditorMapMenu.setAttribute('aria-expanded', String(!editorMapMenu.hidden));
});

document.addEventListener('click', function(event) {
    if (!editorMapMenu.hidden &&
        !editorMapMenu.contains(event.target) &&
        event.target !== toggleEditorMapMenu) {
        editorMapMenu.hidden = true;
        toggleEditorMapMenu.setAttribute('aria-expanded', 'false');
    }
});

enterEditorButton.addEventListener('click', function() {
    if (enterEditorButton.disabled || !selectedMap || !selectedFloor) return;

    setupFlow.hidden = true;
    document.querySelector('body > header').hidden = false;
    document.querySelector('.plantas').hidden = false;
    document.querySelector('.conteinerMapas').hidden = true;
    document.querySelectorAll(
        '.barra > .icons:first-child > .def > .operadores, ' +
        '.barra > .icons:first-child > .atq > .operadores'
    ).forEach(function(group) {
        group.classList.add('operator-library-hidden');
    });
    document.querySelectorAll(
        '.barra > .icons:first-child > .def, ' +
        '.barra > .icons:first-child > .atq'
    ).forEach(function(group) {
        group.hidden = true;
    });
    renderEditorFloors();
    renderEditorMapMenu();
    renderEditorBanList();
    renderPlayerPanels();
    editorMapControls.hidden = false;
    changeBackground(selectedFloor.path, selectedFloor.fileName);
});

renderMapCards('');
renderOperatorSlots();
renderBanSlots();
