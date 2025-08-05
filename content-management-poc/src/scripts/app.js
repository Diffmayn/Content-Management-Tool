// app.js

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    console.log('Content Management Tool Initialized');

    // Example function to handle drag-and-drop scheduling
    const initDragAndDrop = () => {
        const calendar = document.getElementById('calendar');
        calendar.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        calendar.addEventListener('drop', (event) => {
            event.preventDefault();
            const data = event.dataTransfer.getData('text/plain');
            // Handle the dropped item (e.g., schedule a task)
            console.log(`Dropped: ${data}`);
        });
    }

    // Example function to show notifications
    const showNotification = (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    // Call initialization functions
    initDragAndDrop();
    showNotification('Welcome to the Content Management Tool!');

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            document.querySelectorAll('.page-section').forEach(section => {
                section.style.display = section.id === page ? 'block' : 'none';
            });
            // Optionally, call render functions for each page
            if (page === "editorial-projects") renderEditorialProjects();
            if (page === "analytics-dashboard") renderAnalyticsDashboard();
            if (page === "integrations-hub") renderIntegrationsHub();
            if (page === "assets") renderAssets();
            if (page === "samples") renderSamples();
            if (page === "workflow") renderWorkflow();
            if (page === "review") {
                updateReviewAssetDropdown();
                document.getElementById('review-canvas').innerHTML = '';
                document.getElementById('review-comments-panel').innerHTML = '';
            }
            if (page === "overview") renderOverview();
            if (page === "style-guide") renderStyleGuide();
        });
    });

    // Role selection logic
    const roleSelect = document.getElementById('role-select');
    const roleInfo = document.getElementById('role-info');
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            const roles = {
                "studio-manager": "Configure workflows and manage production.",
                "planning-team": "Schedule sessions and monitor progress.",
                "sample-manager": "Manage samples and track their status.",
                "stylist": "Coordinate styling and manage creative briefs.",
                "photography-team": "Execute shoots and organize assets.",
                "copywriter": "Create and optimize content.",
                "art-director": "Review and approve creative assets.",
                "post-production-vendor": "Handle editing and asset delivery."
            };
            const selected = this.value;
            roleInfo.textContent = roles[selected] || "";
        });
    }

    // Drag-and-drop for calendar tasks
    document.querySelectorAll('.calendar-task').forEach(task => {
        task.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.task);
        });
    });

    document.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        day.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        day.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const taskName = e.dataTransfer.getData('text/plain');
            this.innerHTML += `<div class="calendar-task">${taskName}</div>`;
            const log = document.getElementById('calendar-log');
            log.textContent = `Scheduled "${taskName}" for ${this.dataset.day}`;
        });
    });

    // Sample Management logic
    const samples = [
        { id: 'SMP001', name: 'Red Dress', status: 'Checked In', location: 'Shelf A1', barcode: '1234567890' },
        { id: 'SMP002', name: 'Blue Jeans', status: 'Checked Out', location: 'Studio', barcode: '0987654321' },
        { id: 'SMP003', name: 'Green Shirt', status: 'Checked In', location: 'Shelf B2', barcode: '1122334455' }
    ];

    const locations = [
        { name: 'Building 1', rooms: [
            { name: 'Room A', shelves: ['Shelf A1', 'Shelf A2'] },
            { name: 'Room B', shelves: ['Shelf B1', 'Shelf B2'] }
        ]},
        { name: 'Studio', rooms: [] }
    ];

    // Bulk actions for Sample Management
    function renderBulkActions() {
        const list = document.getElementById('sample-list');
        if (!list) return;
        let bulkBar = document.getElementById('bulk-bar');
        if (bulkBar) bulkBar.remove();

        bulkBar = document.createElement('div');
        bulkBar.id = 'bulk-bar';
        bulkBar.style.display = 'flex';
        bulkBar.style.gap = '12px';
        bulkBar.style.marginBottom = '18px';

        bulkBar.innerHTML = `
            <button id="bulk-checkin" class="nav-btn">Bulk Check In</button>
            <button id="bulk-checkout" class="nav-btn">Bulk Check Out</button>
            <button id="bulk-move" class="nav-btn">Bulk Move</button>
            <span style="margin-left:auto;color:#888;">Select samples below for bulk actions</span>
        `;
        list.parentNode.insertBefore(bulkBar, list);

        document.getElementById('bulk-checkin').onclick = () => {
            document.querySelectorAll('.sample-checkbox:checked').forEach(cb => {
                const idx = parseInt(cb.dataset.idx);
                samples[idx].status = 'Checked In';
                samples[idx].location = 'Shelf A1';
            });
            renderSamples(document.getElementById('sample-search').value);
        };
        document.getElementById('bulk-checkout').onclick = () => {
            document.querySelectorAll('.sample-checkbox:checked').forEach(cb => {
                const idx = parseInt(cb.dataset.idx);
                samples[idx].status = 'Checked Out';
                samples[idx].location = 'Studio';
            });
            renderSamples(document.getElementById('sample-search').value);
        };
        document.getElementById('bulk-move').onclick = () => {
            const selector = document.createElement('select');
            selector.innerHTML = locations.map(loc =>
                `<optgroup label="${loc.name}">` +
                loc.rooms.map(room =>
                    `<optgroup label="${room.name}">` +
                    room.shelves.map(shelf =>
                        `<option value="${shelf}">${shelf}</option>`
                    ).join('') +
                    `</optgroup>`
                ).join('') +
                `</optgroup>`
            ).join('');
            selector.onchange = () => {
                document.querySelectorAll('.sample-checkbox:checked').forEach(cb => {
                    const idx = parseInt(cb.dataset.idx);
                    samples[idx].location = selector.value;
                });
                renderSamples(document.getElementById('sample-search').value);
            };
            bulkBar.appendChild(selector);
        };
    }

    function renderSamples(filter = '') {
        const list = document.getElementById('sample-list');
        if (!list) return;
        let foundBarcodes = new Set();
        list.innerHTML = '';
        samples
            .map((sample, idx) => ({ sample, idx }))
            .filter(({ sample }) =>
                sample.name.toLowerCase().includes(filter.toLowerCase()) ||
                sample.id.toLowerCase().includes(filter.toLowerCase()) ||
                sample.barcode.includes(filter)
            )
            .forEach(({ sample, idx }) => {
                // Duplicate barcode alert
                if (foundBarcodes.has(sample.barcode)) {
                    showNotification(`Duplicate barcode detected: ${sample.barcode}`);
                }
                foundBarcodes.add(sample.barcode);

                const item = document.createElement('div');
                item.className = 'sample-item';
                item.innerHTML = `
                    <input type="checkbox" class="sample-checkbox" data-idx="${idx}" style="margin-right:16px;">
                    <div class="sample-info">
                        <strong>${sample.name}</strong>
                        <span>ID: ${sample.id}</span>
                        <span>Status: <span style="color:${sample.status === 'Checked In' ? '#22c55e' : '#f59e42'}">${sample.status}</span></span>
                        <span>Location: ${sample.location}</span>
                        <span>Barcode: ${sample.barcode}</span>
                    </div>
                    <div class="sample-actions">
                        <button class="checkin" ${sample.status === 'Checked In' ? 'disabled' : ''}>Check In</button>
                        <button class="checkout" ${sample.status === 'Checked Out' ? 'disabled' : ''}>Check Out</button>
                        <button class="move">Move</button>
                        <button class="nav-btn" data-action="ai-sample-enhance">AI Enhance</button>
                    </div>
                `;
                // Button logic
                item.querySelector('.checkin').addEventListener('click', () => {
                    sample.status = 'Checked In';
                    sample.location = 'Shelf A1';
                    renderSamples(document.getElementById('sample-search').value);
                });
                item.querySelector('.checkout').addEventListener('click', () => {
                    sample.status = 'Checked Out';
                    sample.location = 'Studio';
                    renderSamples(document.getElementById('sample-search').value);
                });
                item.querySelector('.move').addEventListener('click', () => {
                    // Show location hierarchy selector
                    const selector = document.createElement('select');
                    selector.innerHTML = locations.map(loc =>
                        `<optgroup label="${loc.name}">` +
                        loc.rooms.map(room =>
                            `<optgroup label="${room.name}">` +
                            room.shelves.map(shelf =>
                                `<option value="${shelf}">${shelf}</option>`
                            ).join('') +
                            `</optgroup>`
                        ).join('') +
                        `</optgroup>`
                    ).join('');
                    selector.addEventListener('change', () => {
                        sample.location = selector.value;
                        renderSamples(document.getElementById('sample-search').value);
                    });
                    item.querySelector('.sample-actions').appendChild(selector);
                });
                item.querySelector('[data-action="ai-sample-enhance"]').onclick = () => showAISampleEnhanceModal(sample);
                list.appendChild(item);
            });

        // Alert for missing samples
        if (samples.length === 0) {
            showNotification('No samples found!');
        }

        // Render bulk actions bar
        renderBulkActions();
    }

    // Initial render when switching to Sample Management
    document.querySelector('[data-page="samples"]').addEventListener('click', () => {
        renderSamples();
    });

    // Search/filter logic
    const sampleSearch = document.getElementById('sample-search');
    if (sampleSearch) {
        sampleSearch.addEventListener('input', (e) => {
            renderSamples(e.target.value);
        });
    }

    // Mock scan logic
    const scanBtn = document.getElementById('scan-btn');
    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            // Simulate scanning a barcode
            const codes = samples.map(s => s.barcode);
            const randomCode = codes[Math.floor(Math.random() * codes.length)];
            sampleSearch.value = randomCode;
            renderSamples(randomCode);
            showNotification(`Scanned barcode: ${randomCode}`);
        });
    }

    // --- Advanced Planning Calendar Features ---

    // Calendar data model
    let calendarTasks = [
        { id: 1, name: "Shoot Product A", day: "Monday", type: "Photography", status: "Scheduled", assigned: "Alice", description: "Studio shoot for Product A", deadline: "2025-08-06", color: "#0078ff", recurring: false },
        { id: 2, name: "Edit Product B", day: "Tuesday", type: "Editing", status: "Scheduled", assigned: "Bob", description: "Edit images for Product B", deadline: "2025-08-07", color: "#22c55e", recurring: true },
        { id: 3, name: "Review Product C", day: "Wednesday", type: "Review", status: "Scheduled", assigned: "Carol", description: "Review assets for Product C", deadline: "2025-08-08", color: "#f59e42", recurring: false }
    ];

    const teamMembers = ["Alice", "Bob", "Carol", "David"];
    const taskTypes = ["Photography", "Editing", "Review", "Copywriting"];
    const calendarDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Render calendar with advanced features
    function renderCalendar(view = "week") {
        const container = document.querySelector('.calendar-container');
        if (!container) return;
        container.innerHTML = '';

        // View selector
        const viewSelector = document.createElement('select');
        viewSelector.innerHTML = `
            <option value="day">Day</option>
            <option value="week" selected>Week</option>
            <option value="month">Month</option>
        `;
        viewSelector.onchange = () => renderCalendar(viewSelector.value);
        container.appendChild(viewSelector);

        // Filter bar
        const filterBar = document.createElement('div');
        filterBar.style.display = 'flex';
        filterBar.style.gap = '12px';
        filterBar.style.margin = '16px 0';
        filterBar.innerHTML = `
            <select id="filter-type">
                <option value="">All Types</option>
                ${taskTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
            <select id="filter-member">
                <option value="">All Members</option>
                ${teamMembers.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
            <select id="filter-status">
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
            </select>
        `;
        container.appendChild(filterBar);

        // Calendar grid
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${calendarDays.length}, 1fr)`;
        grid.style.gap = '16px';

        calendarDays.forEach(day => {
            const dayCol = document.createElement('div');
            dayCol.className = 'calendar-day';
            dayCol.dataset.day = day;
            dayCol.innerHTML = `<strong>${day}</strong>`;
            dayCol.style.minHeight = '120px';
            dayCol.style.background = "#f0f4f8";
            dayCol.style.borderRadius = "8px";
            dayCol.style.padding = "8px";

            // Drag-and-drop support
            dayCol.addEventListener('dragover', e => e.preventDefault());
            dayCol.addEventListener('drop', function(e) {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                const task = calendarTasks.find(t => t.id == taskId);
                if (task) {
                    task.day = day;
                    renderCalendar(view);
                    showNotification(`Moved "${task.name}" to ${day}`);
                }
            });

            // Render tasks for this day
            calendarTasks.filter(t => t.day === day).forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.className = 'calendar-task';
                taskDiv.draggable = true;
                taskDiv.style.background = task.color;
                taskDiv.style.margin = "8px 0";
                taskDiv.style.padding = "8px";
                taskDiv.style.borderRadius = "6px";
                taskDiv.innerHTML = `
                    <span>${task.name}</span>
                    <span style="float:right;">${task.assigned}</span>
                `;
                taskDiv.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', task.id);
                });
                // Click to edit/view details
                taskDiv.addEventListener('click', () => showTaskModal(task));
                taskDiv.innerHTML += `<button class="nav-btn" data-action="ai-task-enhance" style="margin-left:8px;">AI Enhance</button>`;
                taskDiv.querySelector('[data-action="ai-task-enhance"]').onclick = () => showAITaskEnhanceModal(task);
                dayCol.appendChild(taskDiv);
            });

            grid.appendChild(dayCol);
        });

        container.appendChild(grid);

        // Filtering logic
        filterBar.querySelectorAll('select').forEach(sel => {
            sel.onchange = () => {
                let filtered = calendarTasks;
                const type = filterBar.querySelector('#filter-type').value;
                const member = filterBar.querySelector('#filter-member').value;
                const status = filterBar.querySelector('#filter-status').value;
                if (type) filtered = filtered.filter(t => t.type === type);
                if (member) filtered = filtered.filter(t => t.assigned === member);
                if (status) filtered = filtered.filter(t => t.status === status);
                // Re-render only filtered tasks
                calendarDays.forEach(day => {
                    const dayCol = grid.querySelector(`[data-day="${day}"]`);
                    if (dayCol) {
                        // Remove old tasks
                        Array.from(dayCol.querySelectorAll('.calendar-task')).forEach(el => el.remove());
                        // Add filtered tasks
                        filtered.filter(t => t.day === day).forEach(task => {
                            const taskDiv = document.createElement('div');
                            taskDiv.className = 'calendar-task';
                            taskDiv.draggable = true;
                            taskDiv.style.background = task.color;
                            taskDiv.style.margin = "8px 0";
                            taskDiv.style.padding = "8px";
                            taskDiv.style.borderRadius = "6px";
                            taskDiv.innerHTML = `
                                <span>${task.name}</span>
                                <span style="float:right;">${task.assigned}</span>
                            `;
                            taskDiv.addEventListener('dragstart', e => {
                                e.dataTransfer.setData('text/plain', task.id);
                            });
                            taskDiv.addEventListener('click', () => showTaskModal(task));
                            taskDiv.innerHTML += `<button class="nav-btn" data-action="ai-task-enhance" style="margin-left:8px;">AI Enhance</button>`;
                            taskDiv.querySelector('[data-action="ai-task-enhance"]').onclick = () => showAITaskEnhanceModal(task);
                            dayCol.appendChild(taskDiv);
                        });
                    }
                });
            };
        });
    }

    // Modal for task details/editing
    function showTaskModal(task) {
        let modal = document.getElementById('task-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'task-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '32px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <h3>Edit Task</h3>
            <label>Name: <input id="modal-name" value="${task.name}" /></label><br>
            <label>Description: <input id="modal-desc" value="${task.description}" /></label><br>
            <label>Assigned: 
                <select id="modal-assigned">
                    ${teamMembers.map(m => `<option value="${m}" ${task.assigned === m ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
            </label><br>
            <label>Type: 
                <select id="modal-type">
                    ${taskTypes.map(t => `<option value="${t}" ${task.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
            </label><br>
            <label>Status: 
                <select id="modal-status">
                    <option value="Scheduled" ${task.status === "Scheduled" ? "selected" : ""}>Scheduled</option>
                    <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>Completed</option>
                    <option value="Overdue" ${task.status === "Overdue" ? "selected" : ""}>Overdue</option>
                </select>
            </label><br>
            <label>Deadline: <input id="modal-deadline" type="date" value="${task.deadline}" /></label><br>
            <label>Recurring: <input id="modal-recurring" type="checkbox" ${task.recurring ? "checked" : ""} /></label><br>
            <button id="modal-save" class="nav-btn primary">Save</button>
            <button id="modal-cancel" class="nav-btn">Cancel</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('modal-save').onclick = () => {
            task.name = document.getElementById('modal-name').value;
            task.description = document.getElementById('modal-desc').value;
            task.assigned = document.getElementById('modal-assigned').value;
            task.type = document.getElementById('modal-type').value;
            task.status = document.getElementById('modal-status').value;
            task.deadline = document.getElementById('modal-deadline').value;
            task.recurring = document.getElementById('modal-recurring').checked;
            renderCalendar();
            modal.remove();
            showNotification('Task updated!');
        };
        document.getElementById('modal-cancel').onclick = () => modal.remove();
    }

    // Show calendar when switching to calendar page
    document.querySelector('[data-page="calendar"]').addEventListener('click', () => {
        renderCalendar();
    });

    function renderOverview() {
        // Total tasks
        const totalTasks = calendarTasks.length;
        document.getElementById('overview-total-tasks').textContent = totalTasks;

        // Active samples
        const activeSamples = samples.filter(s => s.status === 'Checked In').length;
        document.getElementById('overview-active-samples').textContent = activeSamples;

        // Upcoming deadlines (next 3)
        const upcoming = calendarTasks
            .filter(t => new Date(t.deadline) >= new Date())
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 3);
        const deadlinesList = document.getElementById('overview-upcoming-deadlines');
        deadlinesList.innerHTML = upcoming.length
            ? upcoming.map(t => `<li>${t.name} - ${t.deadline}</li>`).join('')
            : '<li>No upcoming deadlines</li>';

        // Team utilization
        const utilization = teamMembers.map(member => {
            const count = calendarTasks.filter(t => t.assigned === member).length;
            return `<li>${member}: ${count} task${count !== 1 ? 's' : ''}</li>`;
        }).join('');
        document.getElementById('overview-team-utilization').innerHTML = utilization;
    }

    // Render overview when switching to Overview tab
    document.querySelector('[data-page="overview"]').addEventListener('click', () => {
        renderOverview();
    });

    // --- Workflow Designer ---

    // --- Workflow Designer with branching, dependencies, export/import ---

    // Add dependency and branching fields to steps
    let workflowSteps = [
        { id: 1, title: "Sample Check-In", type: "Input", description: "Receive and register sample", conditional: false, dependsOn: [], branches: [] },
        { id: 2, title: "Photography", type: "Action", description: "Capture product images", conditional: false, dependsOn: [1], branches: [] },
        { id: 3, title: "Editing", type: "Action", description: "Edit and enhance images", conditional: false, dependsOn: [2], branches: [] },
        { id: 4, title: "Review", type: "Approval", description: "Stakeholder review", conditional: true, dependsOn: [3], branches: [] }
    ];

    const workflowTemplates = {
        photography: [
            { id: 1, title: "Sample Check-In", type: "Input", description: "Receive and register sample", conditional: false },
            { id: 2, title: "Photography", type: "Action", description: "Capture product images", conditional: false },
            { id: 3, title: "Editing", type: "Action", description: "Edit and enhance images", conditional: false },
            { id: 4, title: "Review", type: "Approval", description: "Stakeholder review", conditional: true }
        ],
        editing: [
            { id: 1, title: "Asset Import", type: "Input", description: "Import assets for editing", conditional: false },
            { id: 2, title: "Editing", type: "Action", description: "Edit images", conditional: false },
            { id: 3, title: "Quality Control", type: "Approval", description: "QC check", conditional: true }
        ],
        review: [
            { id: 1, title: "Draft Creation", type: "Input", description: "Create draft asset", conditional: false },
            { id: 2, title: "Internal Review", type: "Approval", description: "Internal team review", conditional: true },
            { id: 3, title: "Final Approval", type: "Approval", description: "Stakeholder approval", conditional: true }
        ]
    };

    // Export/Import helpers
    function exportWorkflow() {
        const data = JSON.stringify(workflowSteps, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "workflow.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    function importWorkflow(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                workflowSteps = JSON.parse(e.target.result);
                renderWorkflow();
                showNotification("Workflow imported!");
            } catch {
                showNotification("Invalid workflow file!");
            }
        };
        reader.readAsText(file);
    }

    function renderWorkflow() {
        const canvas = document.getElementById('workflow-canvas');
        if (!canvas) return;
        canvas.innerHTML = '';
        workflowSteps.forEach((step, idx) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'workflow-step';
            stepDiv.draggable = true;
            stepDiv.dataset.idx = idx;
            stepDiv.innerHTML = `
                <div class="step-title">${step.title}</div>
                <div class="step-type">${step.type}</div>
                <div class="step-desc">${step.description}</div>
                <div class="step-meta">
                    ${step.dependsOn.length ? `<div>Depends on: ${step.dependsOn.map(id => workflowSteps.find(s => s.id === id)?.title).join(', ')}</div>` : ''}
                    ${step.branches.length ? `<div>Branches to: ${step.branches.map(id => workflowSteps.find(s => s.id === id)?.title).join(', ')}</div>` : ''}
                </div>
                <div class="step-actions">
                    <button class="nav-btn" data-action="edit">Edit</button>
                    <button class="nav-btn" data-action="delete">Delete</button>
                    <button class="nav-btn" data-action="conditional">${step.conditional ? "Conditional" : "Set Conditional"}</button>
                </div>
            `;
            // Drag-and-drop logic
            stepDiv.addEventListener('dragstart', e => {
                stepDiv.classList.add('dragging');
                e.dataTransfer.setData('text/plain', idx);
            });
            stepDiv.addEventListener('dragend', () => {
                stepDiv.classList.remove('dragging');
            });
            // Step actions
            stepDiv.querySelector('[data-action="edit"]').onclick = () => showStepModal(step, idx);
            stepDiv.querySelector('[data-action="delete"]').onclick = () => {
                workflowSteps.splice(idx, 1);
                renderWorkflow();
            };
            stepDiv.querySelector('[data-action="conditional"]').onclick = () => {
                step.conditional = !step.conditional;
                renderWorkflow();
            };
            canvas.appendChild(stepDiv);
            // Connector
            if (idx < workflowSteps.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'workflow-connector';
                canvas.appendChild(connector);
            }
            // Branch connectors (visual)
            step.branches.forEach(branchId => {
                const branchStepIdx = workflowSteps.findIndex(s => s.id === branchId);
                if (branchStepIdx > -1) {
                    const branchConnector = document.createElement('div');
                    branchConnector.className = 'workflow-connector';
                    branchConnector.style.background = '#22c55e';
                    branchConnector.style.height = '2px';
                    branchConnector.style.margin = '4px 0';
                    branchConnector.title = `Branch to: ${workflowSteps[branchStepIdx].title}`;
                    canvas.appendChild(branchConnector);
                }
            });
        });

        // Drag-and-drop reordering
        canvas.querySelectorAll('.workflow-step').forEach(stepDiv => {
            stepDiv.addEventListener('dragover', e => e.preventDefault());
            stepDiv.addEventListener('drop', function(e) {
                e.preventDefault();
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                const toIdx = parseInt(this.dataset.idx);
                if (fromIdx !== toIdx) {
                    const moved = workflowSteps.splice(fromIdx, 1)[0];
                    workflowSteps.splice(toIdx, 0, moved);
                    renderWorkflow();
                }
            });
        });
    }

    // Modal for step editing/creation with dependencies and branching
    function showStepModal(step = {}, idx = null) {
        let modal = document.getElementById('step-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'step-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '32px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <h3>${idx === null ? "Add Step" : "Edit Step"}</h3>
            <label>Title: <input id="step-title" value="${step.title || ''}" /></label><br>
            <label>Type: 
                <select id="step-type">
                    <option value="Input" ${step.type === "Input" ? "selected" : ""}>Input</option>
                    <option value="Action" ${step.type === "Action" ? "selected" : ""}>Action</option>
                    <option value="Approval" ${step.type === "Approval" ? "selected" : ""}>Approval</option>
                </select>
            </label><br>
            <label>Description: <input id="step-desc" value="${step.description || ''}" /></label><br>
            <label>Conditional: <input id="step-conditional" type="checkbox" ${step.conditional ? "checked" : ""} /></label><br>
            <label>Depends on: 
                <select id="step-dependsOn" multiple style="min-width:180px;">
                    ${workflowSteps.map(s => `<option value="${s.id}" ${step.dependsOn?.includes(s.id) ? "selected" : ""}>${s.title}</option>`).join('')}
                </select>
            </label><br>
            <label>Branches to: 
                <select id="step-branches" multiple style="min-width:180px;">
                    ${workflowSteps.map(s => `<option value="${s.id}" ${step.branches?.includes(s.id) ? "selected" : ""}>${s.title}</option>`).join('')}
                </select>
            </label><br>
            <button id="step-save" class="nav-btn primary">Save</button>
            <button id="step-cancel" class="nav-btn">Cancel</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('step-save').onclick = () => {
            const newStep = {
                id: step.id || Date.now(),
                title: document.getElementById('step-title').value,
                type: document.getElementById('step-type').value,
                description: document.getElementById('step-desc').value,
                conditional: document.getElementById('step-conditional').checked,
                dependsOn: Array.from(document.getElementById('step-dependsOn').selectedOptions).map(opt => parseInt(opt.value)),
                branches: Array.from(document.getElementById('step-branches').selectedOptions).map(opt => parseInt(opt.value))
            };
            if (idx === null) {
                workflowSteps.push(newStep);
            } else {
                workflowSteps[idx] = newStep;
            }
            renderWorkflow();
            modal.remove();
            showNotification('Step saved!');
        };
        document.getElementById('step-cancel').onclick = () => modal.remove();
    }

    // Toolbar actions
    document.getElementById('add-step').onclick = () => showStepModal();
    document.getElementById('save-workflow').onclick = () => {
        document.getElementById('workflow-log').textContent = "Workflow saved!";
    };
    document.getElementById('workflow-template').onchange = function() {
        const val = this.value;
        if (workflowTemplates[val]) {
            workflowSteps = workflowTemplates[val].map(s => ({ ...s, dependsOn: [], branches: [] }));
            renderWorkflow();
            document.getElementById('workflow-log').textContent = `Loaded "${val}" template.`;
        }
    };

    // Export/Import buttons
    const workflowToolbar = document.querySelector('.workflow-toolbar');
    if (workflowToolbar) {
        const exportBtn = document.createElement('button');
        exportBtn.textContent = "Export";
        exportBtn.className = "nav-btn";
        exportBtn.onclick = exportWorkflow;
        workflowToolbar.appendChild(exportBtn);

        const importInput = document.createElement('input');
        importInput.type = "file";
        importInput.accept = ".json";
        importInput.style.display = "none";
        importInput.onchange = e => {
            if (e.target.files[0]) importWorkflow(e.target.files[0]);
        };
        const importBtn = document.createElement('button');
        importBtn.textContent = "Import";
        importBtn.className = "nav-btn";
        importBtn.onclick = () => importInput.click();
        workflowToolbar.appendChild(importBtn);
        workflowToolbar.appendChild(importInput);
    }

    // Render workflow when switching to Workflow tab
    document.querySelector('[data-page="workflow"]').addEventListener('click', () => {
        renderWorkflow();
    });

    // --- Asset/File Management ---

    assets = [
        // Example asset
        // {
        //     id: 1,
        //     name: "ProductA.jpg",
        //     tags: ["product", "photo"],
        //     versions: [
        //         { version: 1, date: "2025-08-01", uploader: "Alice", url: "..." }
        //     ]
        // }
    ];

    function renderAssetBulkBar() {
        const list = document.getElementById('asset-list');
        if (!list) return;
        let bulkBar = document.getElementById('asset-bulk-bar');
        if (bulkBar) bulkBar.remove();

        bulkBar = document.createElement('div');
        bulkBar.id = 'asset-bulk-bar';
        bulkBar.style.display = 'flex';
        bulkBar.style.gap = '12px';
        bulkBar.style.marginBottom = '18px';

        bulkBar.innerHTML = `
            <button id="bulk-delete-assets" class="nav-btn">Bulk Delete</button>
            <button id="bulk-tag-assets" class="nav-btn">Bulk Tag</button>
            <span style="margin-left:auto;color:#888;">Select assets below for bulk actions</span>
        `;
        list.parentNode.insertBefore(bulkBar, list);

        document.getElementById('bulk-delete-assets').onclick = () => {
            document.querySelectorAll('.asset-checkbox:checked').forEach(cb => {
                const idx = parseInt(cb.dataset.idx);
                assets.splice(idx, 1);
            });
            renderAssets(document.getElementById('asset-search').value, document.getElementById('asset-filter-tag').value);
        };
        document.getElementById('bulk-tag-assets').onclick = () => {
            const tag = prompt("Enter tag to add to selected assets:");
            if (tag) {
                document.querySelectorAll('.asset-checkbox:checked').forEach(cb => {
                    const idx = parseInt(cb.dataset.idx);
                    if (!assets[idx].tags.includes(tag)) assets[idx].tags.push(tag);
                });
                renderAssets(document.getElementById('asset-search').value, document.getElementById('asset-filter-tag').value);
            }
        };
    }

    function renderAssets(search = '', filterTag = '') {
        const list = document.getElementById('asset-list');
        if (!list) return;
        list.innerHTML = '';
        assets
            .map((asset, idx) => ({ asset, idx }))
            .filter(({ asset }) =>
                asset.name.toLowerCase().includes(search.toLowerCase()) ||
                asset.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
            )
            .filter(({ asset }) =>
                !filterTag || asset.tags.includes(filterTag)
            )
            .forEach(({ asset, idx }) => {
                const card = document.createElement('div');
                card.className = 'asset-card';
                card.innerHTML = `
                    <input type="checkbox" class="asset-checkbox" data-idx="${idx}" style="margin-bottom:8px;">
                    ${asset.versions[asset.versions.length-1].url ? `<img src="${asset.versions[asset.versions.length-1].url}" class="asset-preview" alt="${asset.name}"/>` : ''}
                    <strong>${asset.name}</strong>
                    <div class="asset-tags">${asset.tags.map(tag => `<span class="asset-tag">${tag}</span>`).join('')}</div>
                    <div class="asset-actions">
                        <button class="nav-btn" data-action="tag">Edit Tags</button>
                        <button class="nav-btn" data-action="version">Version History</button>
                        <button class="nav-btn" data-action="upload">Upload New Version</button>
                        <button class="nav-btn" data-action="ai-enhance">AI Enhance</button>
                        <button class="nav-btn" data-action="ai-tags">AI Tag Suggest</button>
                    </div>
                `;
                // Tag editing
                card.querySelector('[data-action="tag"]').onclick = () => showTagModal(asset);
                // Version history
                card.querySelector('[data-action="version"]').onclick = () => showVersionModal(asset);
                // Upload new version
                card.querySelector('[data-action="upload"]').onclick = () => showUploadModal(asset);
                // AI enhancement
                card.querySelector('[data-action="ai-enhance"]').onclick = () => showAIEnhanceModal(asset);
                // AI tag suggestion
                card.querySelector('[data-action="ai-tags"]').onclick = () => suggestTagsForAsset(asset);
                list.appendChild(card);
            });

        renderAssetBulkBar();
    }

    // Add search/filter UI
    document.getElementById('assets').insertAdjacentHTML('afterbegin', `
        <div class="asset-search-bar" style="display:flex;gap:12px;margin-bottom:18px;">
            <input type="text" id="asset-search" placeholder="Search by name or tag..." style="flex:1;">
            <select id="asset-filter-tag">
                <option value="">All Tags</option>
            </select>
        </div>
    `);

    // Update tag filter dropdown
    function updateTagFilterDropdown() {
        const tagSelect = document.getElementById('asset-filter-tag');
        if (!tagSelect) return;
        const allTags = Array.from(new Set(assets.flatMap(a => a.tags)));
        tagSelect.innerHTML = `<option value="">All Tags</option>` + allTags.map(tag => `<option value="${tag}">${tag}</option>`).join('');
    }

    // Search/filter logic
    document.getElementById('asset-search').addEventListener('input', () => {
        renderAssets(document.getElementById('asset-search').value, document.getElementById('asset-filter-tag').value);
    });
    document.getElementById('asset-filter-tag').addEventListener('change', () => {
        renderAssets(document.getElementById('asset-search').value, document.getElementById('asset-filter-tag').value);
    });

    // Initial asset upload
    document.getElementById('upload-btn').onclick = () => {
        const files = document.getElementById('asset-upload').files;
        const tags = document.getElementById('asset-tags').value.split(',').map(t => t.trim()).filter(Boolean);
        Array.from(files).forEach(file => {
            const url = URL.createObjectURL(file);
            assets.push({
                id: Date.now() + Math.random(),
                name: file.name,
                tags,
                versions: [{
                    version: 1,
                    date: new Date().toISOString().slice(0,10),
                    uploader: "You",
                    url
                }]
            });
        });
        updateTagFilterDropdown();
        renderAssets(document.getElementById('asset-search').value, document.getElementById('asset-filter-tag').value);
        showNotification('Asset(s) uploaded!');
    };

    // --- Review & Collaboration ---

    // Test data for assets
    assets = [
        {
            id: 101,
            name: "RedDress.jpg",
            tags: ["fashion", "dress", "photo"],
            versions: [
                { version: 1, date: "2025-08-01", uploader: "Alice", url: "https://via.placeholder.com/400x300?text=Red+Dress+v1" },
                { version: 2, date: "2025-08-03", uploader: "Bob", url: "https://via.placeholder.com/400x300?text=Red+Dress+v2" }
            ]
        },
        {
            id: 102,
            name: "BlueJeans.jpg",
            tags: ["fashion", "jeans", "photo"],
            versions: [
                { version: 1, date: "2025-08-02", uploader: "Carol", url: "https://via.placeholder.com/400x300?text=Blue+Jeans+v1" }
            ]
        }
    ];

    // Live collaboration state (simulated for demo)
    let reviewState = {
        assetId: null,
        comments: [],
        markups: []
    };

    // Simulated users for threaded comments
    const users = ["You", "Alice", "Bob", "Carol"];

    // Simulated notification system (can be replaced with WebSocket events)
    function sendCollabNotification(msg) {
        showNotification(`[Collab] ${msg}`);
    }

    // Populate asset dropdown for review
    function updateReviewAssetDropdown() {
        const select = document.getElementById('review-asset-select');
        if (!select) return;
        select.innerHTML = `<option value="">Select asset to review...</option>` +
            assets.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    }

    // Start review session
    document.getElementById('start-review-btn').onclick = () => {
        const assetId = document.getElementById('review-asset-select').value;
        if (!assetId) return showNotification("Select an asset to review.");
        reviewState.assetId = assetId;
        // Demo: preload some comments and markups for collaboration
        if (assetId == 101) {
            reviewState.comments = [
                {
                    text: "Great color, but can we brighten the background?",
                    x: 30, y: 40, author: "Alice", date: "2025-08-04 10:15",
                    replies: [
                        { text: "Agreed, I'll adjust it.", author: "You", date: "2025-08-04 10:17" }
                    ]
                },
                {
                    text: "Please remove the tag from the sleeve.",
                    x: 70, y: 60, author: "Bob", date: "2025-08-04 10:20",
                    replies: []
                }
            ];
            reviewState.markups = [
                { x: 30, y: 40 },
                { x: 70, y: 60 }
            ];
        } else {
            reviewState.comments = [];
            reviewState.markups = [];
        }
        renderReviewCanvas();
        renderReviewComments();
        sendCollabNotification("Review session started");
    };

    // Render review canvas with markup support
    function renderReviewCanvas() {
        const canvas = document.getElementById('review-canvas');
        if (!canvas) return;
        canvas.innerHTML = '';
        const asset = assets.find(a => a.id == reviewState.assetId);
        if (!asset) return;
        const imgUrl = asset.versions[asset.versions.length-1].url;
        const img = document.createElement('img');
        img.src = imgUrl;
        img.className = 'review-asset-img';
        img.style.position = 'relative';
        canvas.appendChild(img);

        // Markup overlay
        const markupLayer = document.createElement('div');
        markupLayer.className = 'review-markup';
        markupLayer.style.position = 'absolute';
        markupLayer.style.top = '0';
        markupLayer.style.left = '0';
        markupLayer.style.width = '100%';
        markupLayer.style.height = '100%';
        markupLayer.style.pointerEvents = 'none';
        canvas.appendChild(markupLayer);

        // Add markup/comment on click
        img.onclick = function(e) {
            const rect = img.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            showCommentModal(x, y);
        };

        // Render markups
        reviewState.markups.forEach((m, idx) => {
            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.left = `${m.x}%`;
            dot.style.top = `${m.y}%`;
            dot.style.width = '16px';
            dot.style.height = '16px';
            dot.style.background = '#0078ff';
            dot.style.borderRadius = '50%';
            dot.style.border = '2px solid #fff';
            dot.style.boxShadow = '0 2px 8px rgba(0,120,255,0.12)';
            dot.style.transform = 'translate(-50%, -50%)';
            dot.style.cursor = 'pointer';
            dot.title = reviewState.comments[idx]?.text || 'Comment';
            dot.onclick = () => showCommentModal(m.x, m.y, idx);
            markupLayer.appendChild(dot);
        });
    }

    // Show comment modal for markup (threaded, author select)
    function showCommentModal(x, y, idx = null) {
        let modal = document.getElementById('review-comment-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'review-comment-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '28px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';

        let repliesHtml = "";
        if (idx !== null && reviewState.comments[idx].replies) {
            repliesHtml = reviewState.comments[idx].replies.map((r, ridx) => `

                <div style="margin-left:16px;margin-bottom:8px;">
                    <strong>${r.author}</strong>: ${r.text}
                    <span style="font-size:0.9em;color:#aaa;">${r.date}</span>
                    <button class="nav-btn" onclick="(function(){reviewState.comments[${idx}].replies.splice(${ridx},1);renderReviewComments();modal.remove();})()">Delete</button>
                </div>
            `).join('');
        }

        modal.innerHTML = `
            <h3>${idx === null ? "Add" : "Edit"} Comment</h3>
            <label>Author: <select id="review-comment-author">${users.map(u => `<option value="${u}">${u}</option>`).join('')}</select></label><br>
            <textarea id="review-comment-text" rows="4" style="width:100%;">${idx !== null ? reviewState.comments[idx].text : ""}</textarea>
            <br>
            ${idx !== null ? `
                <h4>Replies</h4>
                ${repliesHtml}
                <textarea id="review-reply-text" rows="2" style="width:100%;margin-top:8px;" placeholder="Add a reply..."></textarea>
                <button id="review-reply-save" class="nav-btn">Reply</button>
            ` : ""}

            <button id="review-comment-save" class="nav-btn primary">Save</button>
            <button id="review-comment-cancel" class="nav-btn">Cancel</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('review-comment-save').onclick = () => {
            const text = document.getElementById('review-comment-text').value;
            const author = document.getElementById('review-comment-author').value;
            if (idx === null) {
                reviewState.comments.push({ text, x, y, author, date: new Date().toLocaleString(), replies: [] });
                reviewState.markups.push({ x, y });
                sendCollabNotification(`${author} added a comment`);
            } else {
                reviewState.comments[idx].text = text;
                reviewState.comments[idx].author = author;
                sendCollabNotification(`${author} edited a comment`);
            }
            renderReviewCanvas();
            renderReviewComments();
            modal.remove();
        };
        document.getElementById('review-comment-cancel').onclick = () => modal.remove();

        if (idx !== null && document.getElementById('review-reply-save')) {
            document.getElementById('review-reply-save').onclick = () => {
                const replyText = document.getElementById('review-reply-text').value;
                if (replyText.trim()) {
                    reviewState.comments[idx].replies.push({
                        text: replyText,
                        author: document.getElementById('review-comment-author').value,
                        date: new Date().toLocaleString()
                    });
                    renderReviewComments();
                    modal.remove();
                    sendCollabNotification("Reply added");
                }
            };
        }
    }

    // Render comments panel (threaded)
    function renderReviewComments() {
        const panel = document.getElementById('review-comments-panel');
        if (!panel) return;
        panel.innerHTML = `<h3>Comments</h3>` +
            (reviewState.comments.length
                ? reviewState.comments.map((c, idx) => `
                    <div class="review-comment">
                        <strong>${c.author}</strong> <span class="comment-location">[${c.x.toFixed(1)}%, ${c.y.toFixed(1)}%]</span><br>
                        <span>${c.text}</span><br>
                        <span style="font-size:0.9em;color:#aaa;">${c.date}</span>
                        <button class="nav-btn" onclick="(function(){reviewState.comments.splice(${idx},1);reviewState.markups.splice(${idx},1);renderReviewCanvas();renderReviewComments();sendCollabNotification('Comment deleted');})()">Delete</button>
                        <button class="nav-btn" onclick="(function(){showAIEnhanceCommentModal(reviewState.comments[${idx}]);})()">AI Enhance</button>
                        ${c.replies && c.replies.length ? `<div style="margin-top:8px;"><strong>Replies:</strong>${c.replies.map((r, ridx) => `
                            <div style="margin-left:16px;">
                                <strong>${r.author}</strong>: ${r.text}
                                <span style="font-size:0.9em;color:#aaa;">${r.date}</span>
                                <button class="nav-btn" onclick="(function(){reviewState.comments[${idx}].replies.splice(${ridx},1);renderReviewComments();sendCollabNotification('Reply deleted');})()">Delete</button>
                            </div>
                        `).join('')}</div>` : ""}
                    </div>
                `).join('')
                : `<div>No comments yet. Click on the image to add a markup/comment.</div>`);
    }

    // Update asset dropdown when switching to Review tab
    document.querySelector('[data-page="review"]').addEventListener('click', () => {
        updateReviewAssetDropdown();
        document.getElementById('review-canvas').innerHTML = '';
        document.getElementById('review-comments-panel').innerHTML = '';
    });

    // Optionally, update dropdown after asset upload
    document.querySelector('[data-page="assets"]').addEventListener('click', () => {
        updateReviewAssetDropdown();
    });

    // --- Editorial Projects: Campaign/project creation and milestone tracking ---

    // Demo data for campaigns/projects
    let editorialProjects = [
        {
            id: 1,
            name: "Fall Fashion Campaign",
            description: "Multi-channel campaign for new fall collection.",
            owner: "Alice",
            status: "Active",
            milestones: [
                { id: 101, name: "Kickoff Meeting", due: "2025-08-10", completed: true, notes: "All teams aligned." },
                { id: 102, name: "Sample Arrival", due: "2025-08-12", completed: false, notes: "" },
                { id: 103, name: "Photo Shoot", due: "2025-08-15", completed: false, notes: "" },
                { id: 104, name: "Editing", due: "2025-08-18", completed: false, notes: "" },
                { id: 105, name: "Launch", due: "2025-08-25", completed: false, notes: "" }
            ],
            collaborators: ["Alice", "Bob", "Carol"]
        },
        {
            id: 2,
            name: "Denim Editorial",
            description: "Editorial for denim collection.",
            owner: "Bob",
            status: "Planning",
            milestones: [
                { id: 201, name: "Brief Approval", due: "2025-08-11", completed: true, notes: "Approved by Art Director." },
                { id: 202, name: "Styling", due: "2025-08-13", completed: false, notes: "" },
                { id: 203, name: "Shoot", due: "2025-08-16", completed: false, notes: "" },
                { id: 204, name: "Copywriting", due: "2025-08-19", completed: false, notes: "" }
            ],
            collaborators: ["Bob", "David"]
        }
    ];

    const allUsers = ["Alice", "Bob", "Carol", "David", "You"];

    // --- Editorial Projects: Gantt chart, notifications, dependencies ---

    // Add dependency field to milestones
    editorialProjects.forEach(project => {
        project.milestones.forEach(m => {
            if (m.dependsOn === undefined) m.dependsOn = [];
        });
    });

    // Render editorial projects dashboard (add Gantt chart button)
    function renderEditorialProjects() {
        const container = document.getElementById('editorial-projects');
        if (!container) return;
        container.innerHTML = `
            <div class="editorial-toolbar" style="display:flex;gap:16px;margin-bottom:18px;">
                <button id="add-project-btn" class="nav-btn primary">Add Project</button>
                <select id="project-filter-status">
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Planning">Planning</option>
                    <option value="Completed">Completed</option>
                </select>
                <button id="show-gantt-btn" class="nav-btn">Gantt Chart</button>
            </div>
            <div id="project-list"></div>
            <div id="project-modal-root"></div>
            <div id="gantt-modal-root"></div>
        `;

        document.getElementById('project-filter-status').onchange = function() {
            renderProjectList(this.value);
        };
        document.getElementById('add-project-btn').onclick = () => showProjectModal();
        document.getElementById('show-gantt-btn').onclick = () => showGanttChart();

        renderProjectList();
    }

    // Gantt chart modal
    function showGanttChart() {
        let modal = document.getElementById('gantt-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'gantt-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '32px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        modal.style.maxWidth = '900px';
        modal.style.width = '90%';

        // Simple Gantt chart rendering
        let chartHtml = `<h3>Gantt Chart</h3><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">`;
        chartHtml += `<tr><th style="text-align:left;">Project</th><th>Milestone</th><th>Due</th><th>Dependencies</th><th>Status</th></tr>`;
        editorialProjects.forEach(project => {
            project.milestones.forEach(m => {
                chartHtml += `
                    <tr>
                        <td>${project.name}</td>
                        <td>${m.name}</td>
                        <td>${m.due}</td>
                        <td>${m.dependsOn.map(did => {
                            const dep = project.milestones.find(mm => mm.id === did);
                            return dep ? dep.name : '';
                        }).join(', ')}</td>
                        <td style="color:${m.completed ? '#22c55e' : '#f59e42'};">${m.completed ? "Completed" : "Pending"}</td>
                    </tr>
                `;
            });
        });
        chartHtml += `</table></div><button id="gantt-close" class="nav-btn">Close</button>`;
        modal.innerHTML = chartHtml;
        document.getElementById('gantt-modal-root').appendChild(modal);

        document.getElementById('gantt-close').onclick = () => modal.remove();
    }

    // Modal for project creation/editing
    function showProjectModal(project = {}) {
        let modal = document.getElementById('project-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'project-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '32px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <h3>${project.id ? "Edit" : "Add"} Project</h3>
            <label>Name: <input id="project-name" value="${project.name || ''}" /></label><br>
            <label>Description: <input id="project-desc" value="${project.description || ''}" /></label><br>
            <label>Owner: 
                <select id="project-owner">
                    ${allUsers.map(u => `<option value="${u}" ${project.owner === u ? "selected" : ""}>${u}</option>`).join('')}
                </select>
            </label><br>
            <label>Status: 
                <select id="project-status">
                    <option value="Active" ${project.status === "Active" ? "selected" : ""}>Active</option>
                    <option value="Planning" ${project.status === "Planning" ? "selected" : ""}>Planning</option>
                    <option value="Completed" ${project.status === "Completed" ? "selected" : ""}>Completed</option>
                </select>
            </label><br>
            <label>Collaborators: 
                <select id="project-collaborators" multiple style="min-width:180px;">
                    ${allUsers.map(u => `<option value="${u}" ${project.collaborators?.includes(u) ? "selected" : ""}>${u}</option>`).join('')}
                </select>
            </label><br>
            <button id="project-save" class="nav-btn primary">Save</button>
            <button id="project-cancel" class="nav-btn">Cancel</button>
        `;
        document.getElementById('project-modal-root').appendChild(modal);

        document.getElementById('project-save').onclick = () => {
            const newProject = {
                id: project.id || Date.now(),
                name: document.getElementById('project-name').value,
                description: document.getElementById('project-desc').value,
                owner: document.getElementById('project-owner').value,
                status: document.getElementById('project-status').value,
                collaborators: Array.from(document.getElementById('project-collaborators').selectedOptions).map(opt => opt.value),
                milestones: project.milestones || []
            };
            if (!project.id) {
                editorialProjects.push(newProject);
            } else {
                const idx = editorialProjects.findIndex(p => p.id === project.id);
                editorialProjects[idx] = newProject;
            }
            renderProjectList();
            modal.remove();
            showNotification('Project saved!');
        };
        document.getElementById('project-cancel').onclick = () => modal.remove();
    }

    // Modal for milestone tracking (add dependency selector and notifications)
    function showMilestoneModal(project) {
        let modal = document.getElementById('milestone-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'milestone-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '32px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <h3>Milestones for ${project.name}</h3>
            <div id="milestone-list">
                ${project.milestones.map((m, idx) => `
                    <div style="margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #eee;">
                        <strong>${m.name}</strong> 
                        <span style="color:#888;">Due: ${m.due}</span>
                        <span style="color:${m.completed ? '#22c55e' : '#f59e42'};">${m.completed ? "Completed" : "Pending"}</span>
                        <br>
                        <input type="checkbox" id="milestone-complete-${m.id}" ${m.completed ? "checked" : ""}> Mark Complete
                        <br>
                        <label>Depends on: 
                            <select id="milestone-depends-${m.id}" multiple style="min-width:120px;">
                                ${project.milestones.filter(mm => mm.id !== m.id).map(mm =>
                                    `<option value="${mm.id}" ${m.dependsOn.includes(mm.id) ? "selected" : ""}>${mm.name}</option>`
                                ).join('')}
                            </select>
                        </label>
                        <br>
                        <textarea id="milestone-notes-${m.id}" rows="2" style="width:90%;" placeholder="Notes...">${m.notes || ""}</textarea>
                        <button class="nav-btn" onclick="(function(){
                            m.completed = document.getElementById('milestone-complete-${m.id}').checked;
                            m.notes = document.getElementById('milestone-notes-${m.id}').value;
                            m.dependsOn = Array.from(document.getElementById('milestone-depends-${m.id}').selectedOptions).map(opt => parseInt(opt.value));
                            showNotification('Milestone updated');
                        })()">Save</button>
                        <button class="nav-btn" onclick="(function(){
                            project.milestones.splice(${idx},1);
                            showMilestoneModal(project);
                            showNotification('Milestone deleted');
                        })()">Delete</button>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:18px;">
                <h4>Add Milestone</h4>
                <input id="new-milestone-name" placeholder="Milestone name" style="width:60%;">
                <input id="new-milestone-due" type="date" style="width:30%;">
                <button id="add-milestone-btn" class="nav-btn primary">Add</button>
            </div>
            <button id="milestone-close" class="nav-btn">Close</button>
        `;
        document.getElementById('project-modal-root').appendChild(modal);

        document.getElementById('add-milestone-btn').onclick = () => {
            const name = document.getElementById('new-milestone-name').value;
            const due = document.getElementById('new-milestone-due').value;
            if (name && due) {
                project.milestones.push({
                    id: Date.now(),
                    name,
                    due,
                    completed: false,
                    notes: "",
                    dependsOn: []
                });
                showMilestoneModal(project);
                showNotification('Milestone added');
            }
        };
        document.getElementById('milestone-close').onclick = () => modal.remove();
    }

    // Render editorial projects when switching to Editorial tab
    document.querySelector('[data-page="editorial-projects"]').addEventListener('click', () => {
        renderEditorialProjects();
    });

    // --- Reporting & Analytics: Dashboard with key metrics and charts ---

    // Demo data for reporting
    const analyticsData = {
        tasks: [
            { type: "Photography", count: 12 },
            { type: "Editing", count: 8 },
            { type: "Review", count: 6 },
            { type: "Copywriting", count: 4 }
        ],
        assets: [
            { tag: "fashion", count: 10 },
            { tag: "jeans", count: 5 },
            { tag: "dress", count: 7 }
        ],
        projects: [
            { name: "Fall Fashion Campaign", completed: 2, total: 5 },
            { name: "Denim Editorial", completed: 1, total: 4 }
        ],
        teamUtilization: [
            { member: "Alice", tasks: 7 },
            { member: "Bob", tasks: 6 },
            { member: "Carol", tasks: 5 },
            { member: "David", tasks: 3 }
        ]
    };

    // Render analytics dashboard
    function renderAnalyticsDashboard() {
        const container = document.getElementById('analytics-dashboard');
        if (!container) return;
        container.innerHTML = `
            <h2>Reporting & Analytics</h2>
            <div style="margin-bottom:18px;display:flex;gap:16px;align-items:center;">
                <label>Filter by Team Member:
                    <select id="analytics-filter-member">
                        <option value="">All</option>
                        ${analyticsData.teamUtilization.map(t => `<option value="${t.member}">${t.member}</option>`).join('')}
                    </select>
                </label>
                <label>Filter by Project:
                    <select id="analytics-filter-project">
                        <option value="">All</option>
                        ${analyticsData.projects.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                    </select>
                </label>
                <label>Date Range:
                    <input type="date" id="analytics-date-from">
                    <span>-</span>
                    <input type="date" id="analytics-date-to">
                </label>
                <button id="analytics-export-btn" class="nav-btn">Export Charts</button>
            </div>
            <div style="display:flex;gap:32px;flex-wrap:wrap;">
                <div class="analytics-card" style="flex:1;min-width:320px;">
                    <h3>Task Breakdown</h3>
                    <canvas id="task-chart" height="180"></canvas>
                </div>
                <div class="analytics-card" style="flex:1;min-width:320px;">
                    <h3>Asset Tag Distribution</h3>
                    <canvas id="asset-chart" height="180"></canvas>
                </div>
                <div class="analytics-card" style="flex:1;min-width:320px;">
                    <h3>Project Progress</h3>
                    <canvas id="project-chart" height="180"></canvas>
                </div>
                <div class="analytics-card" style="flex:1;min-width:320px;">
                    <h3>Team Utilization</h3>
                    <canvas id="team-chart" height="180"></canvas>
                </div>
                <div class="analytics-card" style="flex:1;min-width:320px;">
                    <h3>Milestone Timeline</h3>
                    <canvas id="milestone-chart" height="180"></canvas>
                </div>
                <div class="analytics-card" style="flex:1;min-width:320px;">
                    <h3>Task Completion Over Time</h3>
                    <canvas id="completion-chart" height="180"></canvas>
                </div>
            </div>
        `;

        renderAllCharts();

        document.getElementById('analytics-filter-member').onchange = renderAllCharts;
        document.getElementById('analytics-filter-project').onchange = renderAllCharts;
        document.getElementById('analytics-date-from').onchange = renderAllCharts;
        document.getElementById('analytics-date-to').onchange = renderAllCharts;
        document.getElementById('analytics-export-btn').onclick = exportAllCharts;
    }

    // Render all charts with filters and date range
    function renderAllCharts() {
        const member = document.getElementById('analytics-filter-member')?.value || '';
        const project = document.getElementById('analytics-filter-project')?.value || '';
        const dateFrom = document.getElementById('analytics-date-from')?.value;
        const dateTo = document.getElementById('analytics-date-to')?.value;

        // Filtered data
        let teamData = analyticsData.teamUtilization;
        if (member) teamData = teamData.filter(t => t.member === member);

        let projectData = analyticsData.projects;
        if (project) projectData = projectData.filter(p => p.name === project);

        // Date range filter for milestones and tasks
        let milestones = [];
        if (window.editorialProjects) {
            milestones = window.editorialProjects.flatMap(ep => ep.milestones.map(m => ({
                ...m,
                project: ep.name
            })));
            if (dateFrom) milestones = milestones.filter(m => m.due && m.due >= dateFrom);
            if (dateTo) milestones = milestones.filter(m => m.due && m.due <= dateTo);
        }

        let completionData = [];
        if (window.calendarTasks) {
            completionData = window.calendarTasks
                .filter(t => (!dateFrom || t.deadline >= dateFrom) && (!dateTo || t.deadline <= dateTo))
                .map(t => ({
                    date: t.deadline,
                    status: t.status
                }));
        }

        // Task chart (no filter)
        renderTaskChart();

        // Asset chart (no filter)
        renderAssetChart();

        // Project chart (filtered)
        renderProjectChart(projectData);

        // Team chart (filtered)
        renderTeamChart(teamData);

        // Milestone timeline (filtered by date)
        renderMilestoneChart(milestones);

        // New: Task completion over time (line chart)
        renderCompletionChart(completionData);
    }

    // Export charts as images (PNG)
    function exportAllCharts() {
        ['task-chart', 'asset-chart', 'project-chart', 'team-chart', 'milestone-chart', 'completion-chart'].forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `${id}.png`;
                link.click();
            }
        });
        showNotification('Charts exported as PNG images!');
    }

    // Chart.js rendering functions (with filter support)
    function renderTaskChart() {
        const ctx = document.getElementById('task-chart').getContext('2d');
        if (window.taskChartObj) window.taskChartObj.destroy();
        window.taskChartObj = new window.Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: analyticsData.tasks.map(t => t.type),
                datasets: [{
                    data: analyticsData.tasks.map(t => t.count),
                    backgroundColor: '#0078ff'
                }]
                                                                                                                                 },
            options: { plugins: { legend: { display: false } } }
        });
    }

    function renderProjectChart(projectData) {
        const ctx = document.getElementById('project-chart').getContext('2d');
        if (window.projectChartObj) window.projectChartObj.destroy();
        window.projectChartObj = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: projectData.map(p => p.name),
                datasets: [{
                    label: 'Completed',
                    data: projectData.map(p => p.completed),
                    backgroundColor: '#22c55e'
                }, {
                    label: 'Total',
                    data: projectData.map(p => p.total),
                    backgroundColor: '#f59e42'
                }]
            },
            options: { plugins: { legend: { position: 'bottom' } } }
        });
    }

    function renderTeamChart(teamData) {
        const ctx = document.getElementById('team-chart').getContext('2d');
        if (window.teamChartObj) window.teamChartObj.destroy();
        window.teamChartObj = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: teamData.map(t => t.member),
                datasets: [{
                    label: 'Tasks',
                    data: teamData.map(t => t.tasks),
                    backgroundColor: '#6366f1'
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    // Milestone timeline chart (line chart, filtered by date)
    function renderMilestoneChart(milestones) {
        const ctx = document.getElementById('milestone-chart').getContext('2d');
        if (window.milestoneChartObj) window.milestoneChartObj.destroy();

        milestones = milestones || [];
        milestones = milestones.filter(m => m.due).sort((a, b) => new Date(a.due) - new Date(b.due));

        window.milestoneChartObj = new window.Chart(ctx, {
            type: 'line',
            data: {
                labels: milestones.map(m => `${m.project ? m.project + ': ' : ''}${m.name}`),
                datasets: [{
                    label: 'Milestone Timeline',
                    data: milestones.map(m => m.completed ? 1 : 0),
                    borderColor: '#0078ff',
                    backgroundColor: 'rgba(0,120,255,0.08)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                    scales: {
                        y: {
                            min: 0,
                            max: 1,
                            ticks: { stepSize: 1, callback: v => v ? 'Completed' : 'Pending' }
                        }
                    },
                    plugins: { legend: { position: 'bottom' } }
                }
            });
    }

    // New: Task completion over time (line chart)
    function renderCompletionChart(completionData) {
        const ctx = document.getElementById('completion-chart').getContext('2d');
        if (window.completionChartObj) window.completionChartObj.destroy();

        // Group by date
        const dates = [...new Set(completionData.map(c => c.date))].sort();
        const completedCounts = dates.map(date =>
            completionData.filter(c => c.date === date && c.status === "Completed").length
        );
        const scheduledCounts = dates.map(date =>
            completionData.filter(c => c.date === date && c.status === "Scheduled").length
        );
        const overdueCounts = dates.map(date =>
            completionData.filter(c => c.date === date && c.status === "Overdue").length
        );

        window.completionChartObj = new window.Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Completed',
                        data: completedCounts,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34,197,94,0.08)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Scheduled',
                        data: scheduledCounts,
                        borderColor: '#0078ff',
                        backgroundColor: 'rgba(0,120,255,0.08)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Overdue',
                        data: overdueCounts,
                        borderColor: '#f59e42',
                        backgroundColor: 'rgba(245,158,66,0.08)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                    plugins: { legend: { position: 'bottom' } }
                }
            });
    }

    // Render dashboard when switching to Analytics tab
    document.querySelector('[data-page="analytics-dashboard"]').addEventListener('click', () => {
        renderAnalyticsDashboard();
    });

    // --- AI-Powered Tools (Mock): Content Enhancement & Automated Tagging ---

    // AI enhancement modal for assets
    function showAIEnhanceModal(asset) {
        let modal = document.getElementById('ai-enhance-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'ai-enhance-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '32px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <h3>AI Content Enhancement</h3>
            <p>Let AI suggest improvements for <strong>${asset.name}</strong>.</p>
            <button id="ai-enhance-btn" class="nav-btn primary">Enhance Content</button>
            <div id="ai-enhance-result" style="margin-top:18px;"></div>
            <button id="ai-enhance-close" class="nav-btn">Close</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('ai-enhance-btn').onclick = () => {
            // Mock enhancement
            document.getElementById('ai-enhance-result').innerHTML = `
                <strong>Suggested Improvements:</strong>
                <ul>
                    <li>Increase brightness for better visibility.</li>
                    <li>Crop image to focus on product.</li>
                    <li>Auto-correct color balance.</li>
                    <li>Generate SEO-friendly description.</li>
                </ul>
                <button class="nav-btn" id="ai-apply-enhance">Apply Suggestions</button>
            `;
            document.getElementById('ai-apply-enhance').onclick = () => {
                showNotification('AI enhancements applied (mock)!');
                modal.remove();
            };
        };
        document.getElementById('ai-enhance-close').onclick = () => modal.remove();
    }

    // Automated tagging suggestion for assets
    function suggestTagsForAsset(asset) {
        // Mock: Suggest tags based on asset name
        const name = asset.name.toLowerCase();
        let suggestions = [];
        if (name.includes('dress')) suggestions.push('dress');
        if (name.includes('jeans')) suggestions.push('jeans');
        if (name.includes('red')) suggestions.push('red');
        if (name.includes('blue')) suggestions.push('blue');
        if (name.includes('fashion')) suggestions.push('fashion');
        if (suggestions.length === 0) suggestions = ['product', 'photo'];

        // Show modal for suggestions
        let modal = document.getElementById('ai-tag-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'ai-tag-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '32px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <h3>AI Tagging Suggestions</h3>
            <p>Suggested tags for <strong>${asset.name}</strong>:</p>
            <div style="margin-bottom:12px;">
                ${suggestions.map(tag => `<span class="asset-tag">${tag}</span>`).join(' ')}
            </div>
            <button id="ai-apply-tags" class="nav-btn primary">Apply Tags</button>
            <button id="ai-tag-close" class="nav-btn">Close</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('ai-apply-tags').onclick = () => {
            asset.tags = Array.from(new Set([...asset.tags, ...suggestions]));
            renderAssets(document.getElementById('asset-search').value, document.getElementById('asset-filter-tag').value);
            showNotification('AI tags applied!');
            modal.remove();
        };
        document.getElementById('ai-tag-close').onclick = () => modal.remove();
    }

    // Optionally, add AI enhancement to review comments (mock)
    function showAIEnhanceCommentModal(comment) {
        let modal = document.getElementById('ai-enhance-comment-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'ai-enhance-comment-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '28px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <h3>AI Comment Enhancement</h3>
            <p>Original: ${comment.text}</p>
            <button id="ai-enhance-comment-btn" class="nav-btn primary">Enhance Comment</button>
            <div id="ai-enhance-comment-result" style="margin-top:18px;"></div>
            <button id="ai-enhance-comment-close" class="nav-btn">Close</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('ai-enhance-comment-btn').onclick = () => {
            document.getElementById('ai-enhance-comment-result').innerHTML = `
                <strong>Suggested Edit:</strong>
                <div>"${comment.text} (clarified and improved by AI)"</div>
                <button class="nav-btn" id="ai-apply-comment">Apply Edit</button>
            `;
            document.getElementById('ai-apply-comment').onclick = () => {
                comment.text += " (clarified and improved by AI)";
                renderReviewComments();
                showNotification('AI comment enhancement applied!');
                modal.remove();
            };
        };
        document.getElementById('ai-enhance-comment-close').onclick = () => modal.remove();
    }

    // Add AI button to review comments panel (optional, demo)
    function renderReviewComments() {
        const panel = document.getElementById('review-comments-panel');
        if (!panel) return;
        panel.innerHTML = `<h3>Comments</h3>` +
            (reviewState.comments.length
                ? reviewState.comments.map((c, idx) => `
                    <div class="review-comment">
                        <strong>${c.author}</strong> <span class="comment-location">[${c.x.toFixed(1)}%, ${c.y.toFixed(1)}%]</span><br>
                        <span>${c.text}</span><br>
                        <span style="font-size:0.9em;color:#aaa;">${c.date}</span>
                        <button class="nav-btn" onclick="(function(){reviewState.comments.splice(${idx},1);reviewState.markups.splice(${idx},1);renderReviewCanvas();renderReviewComments();sendCollabNotification('Comment deleted');})()">Delete</button>
                        <button class="nav-btn" onclick="(function(){showAIEnhanceCommentModal(reviewState.comments[${idx}]);})()">AI Enhance</button>
                        ${c.replies && c.replies.length ? `<div style="margin-top:8px;"><strong>Replies:</strong>${c.replies.map((r, ridx) => `
                            <div style="margin-left:16px;">
                                <strong>${r.author}</strong>: ${r.text}
                                <span style="font-size:0.9em;color:#aaa;">${r.date}</span>
                                <button class="nav-btn" onclick="(function(){reviewState.comments[${idx}].replies.splice(${ridx},1);renderReviewComments();sendCollabNotification('Reply deleted');})()">Delete</button>
                            </div>
                        `).join('')}</div>` : ""}
                    </div>
                `).join('')
                : `<div>No comments yet. Click on the image to add a markup/comment.</div>`);
    }

    // --- Advanced Contact Sheet & Actions Buttons ---

    // Contact Sheet: Export selected assets as PDF, CSV, or preview grid
    document.getElementById('contact-sheet-btn').addEventListener('click', function(e) {
        let modal = document.getElementById('contact-sheet-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'contact-sheet-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '32px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        const selectedAssets = Array.from(document.querySelectorAll('.asset-checkbox:checked')).map(cb => assets[parseInt(cb.dataset.idx)]);
        modal.innerHTML = `
            <h3>Contact Sheet</h3>
            <div style="margin-bottom:16px;">
                <button id="contact-preview" class="nav-btn primary">Preview Grid</button>
                <button id="contact-export-pdf" class="nav-btn">Export PDF</button>
                <button id="contact-export-csv" class="nav-btn">Export CSV</button>
                <button id="contact-sheet-close" class="nav-btn">Close</button>
            </div>
            <div id="contact-sheet-content"></div>
        `;
        document.body.appendChild(modal);

        // Preview grid
        document.getElementById('contact-preview').onclick = () => {
            const grid = selectedAssets.length ? selectedAssets : assets;
            document.getElementById('contact-sheet-content').innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;">
                    ${grid.map(a => `
                        <div style="border:1px solid #eee;padding:8px;text-align:center;">
                            <img src="${a.versions[a.versions.length-1].url}" alt="${a.name}" style="max-width:100px;max-height:80px;">
                            <div>${a.name}</div>
                            <div style="font-size:0.9em;color:#888;">${a.tags.join(', ')}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        };

        // Export CSV
        document.getElementById('contact-export-csv').onclick = () => {
            const grid = selectedAssets.length ? selectedAssets : assets;
            const csv = [
                ["Name", "Tags", "Latest Version URL"].join(","),
                ...grid.map(a => [
                    `"${a.name}"`,
                    `"${a.tags.join(';')}"`,
                    `"${a.versions[a.versions.length-1].url}"`
                ].join(","))
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "contact-sheet.csv";
            a.click();
            URL.revokeObjectURL(url);
        };

        // Export PDF (simple, using window.print for demo)
        document.getElementById('contact-export-pdf').onclick = () => {
            const grid = selectedAssets.length ? selectedAssets : assets;
            const win = window.open('', '', 'width=800,height=600');
            win.document.write('<html><head><title>Contact Sheet PDF</title></head><body>');
            win.document.write('<h2>Contact Sheet</h2>');
            win.document.write('<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;">');
            grid.forEach(a => {
                win.document.write(`
                    <div style="border:1px solid #eee;padding:8px;text-align:center;">
                        <img src="${a.versions[a.versions.length-1].url}" alt="${a.name}" style="max-width:100px;max-height:80px;">
                        <div>${a.name}</div>
                        <div style="font-size:0.9em;color:#888;">${a.tags.join(', ')}</div>
                    </div>
                `);
            });
            win.document.write('</div></body></html>');
            win.document.close();
            win.print();
        };

        document.getElementById('contact-sheet-close').onclick = () => modal.remove();
    });

    // Actions: Multi-function menu for bulk asset, sample, and project actions
    document.getElementById('actions-btn').addEventListener('click', function(e) {
        let modal = document.getElementById('actions-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'actions-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.padding = '32px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <h3>Actions</h3>
            <div style="display:flex;flex-direction:column;gap:12px;">
                <button id="bulk-delete-assets" class="nav-btn">Bulk Delete Assets</button>
                <button id="bulk-tag-assets" class="nav-btn">Bulk Tag Assets</button>
                <button id="bulk-checkin-samples" class="nav-btn">Bulk Check In Samples</button>
                <button id="bulk-checkout-samples" class="nav-btn">Bulk Check Out Samples</button>
                <button id="bulk-move-samples" class="nav-btn">Bulk Move Samples</button>
                <button id="bulk-complete-projects" class="nav-btn">Bulk Complete Projects</button>
                <button id="actions-close" class="nav-btn">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Bulk asset delete
        document.getElementById('bulk-delete-assets').onclick = () => {
            document.querySelectorAll('.asset-checkbox:checked').forEach(cb => {
                const idx = parseInt(cb.dataset.idx);
                assets.splice(idx, 1);
            });
            renderAssets(document.getElementById('asset-search').value, document.getElementById('asset-filter-tag').value);
            showNotification('Selected assets deleted!');
        };

        // Bulk asset tag
        document.getElementById('bulk-tag-assets').onclick = () => {
            const tag = prompt("Enter tag to add to selected assets:");
            if (tag) {
                document.querySelectorAll('.asset-checkbox:checked').forEach(cb => {
                    const idx = parseInt(cb.dataset.idx);
                    if (!assets[idx].tags.includes(tag)) assets[idx].tags.push(tag);
                });
                renderAssets(document.getElementById('asset-search').value, document.getElementById('asset-filter-tag').value);
                showNotification('Tag added to selected assets!');
            }
        };

        // Bulk sample check in
        document.getElementById('bulk-checkin-samples').onclick = () => {
            document.querySelectorAll('.sample-checkbox:checked').forEach(cb => {
                const idx = parseInt(cb.dataset.idx);
                samples[idx].status = 'Checked In';
                samples[idx].location = 'Shelf A1';
            });
            renderSamples(document.getElementById('sample-search').value);
            showNotification('Selected samples checked in!');
        };

        // Bulk sample check out
        document.getElementById('bulk-checkout-samples').onclick = () => {
            document.querySelectorAll('.sample-checkbox:checked').forEach(cb => {
                const idx = parseInt(cb.dataset.idx);
                samples[idx].status = 'Checked Out';
                samples[idx].location = 'Studio';
            });
            renderSamples(document.getElementById('sample-search').value);
            showNotification('Selected samples checked out!');
        };

        // Bulk sample move
        document.getElementById('bulk-move-samples').onclick = () => {
            const selector = document.createElement('select');
            selector.innerHTML = locations.map(loc =>
                `<optgroup label="${loc.name}">` +
                loc.rooms.map(room =>
                    `<optgroup label="${room.name}">` +
                    room.shelves.map(shelf =>
                        `<option value="${shelf}">${shelf}</option>`
                    ).join('') +
                    `</optgroup>`
                ).join('') +
                `</optgroup>`
            ).join('');
            selector.onchange = () => {
                document.querySelectorAll('.sample-checkbox:checked').forEach(cb => {
                    const idx = parseInt(cb.dataset.idx);
                    samples[idx].location = selector.value;
                });
                renderSamples(document.getElementById('sample-search').value);
                showNotification('Selected samples moved!');
            };
            bulkBar.appendChild(selector);
        };
    });

    // --- Debugging and Development Tools ---

    // Toggle debug mode (shows/hides debug info panel)
    let debugMode = false;
    function toggleDebugMode() {
        debugMode = !debugMode;
        const panel = document.getElementById('debug-panel');
        if (debugMode) {
            panel.style.display = 'block';
            panel.innerHTML = `
                <h3>Debug Info</h3>
                <pre>${JSON.stringify({
                    assets,
                    samples,
                    calendarTasks,
                    editorialProjects,
                    workflowSteps
                }, null, 2)}</pre>
            `;
        } else {
            panel.style.display = 'none';
        }
    }
    document.getElementById('debug-toggle').onclick = toggleDebugMode;

    // --- End of app.js ---
});