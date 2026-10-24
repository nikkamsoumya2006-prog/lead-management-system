// --- Initial State and Sample Data ---
let leads = JSON.parse(localStorage.getItem('crm_leads')) || [
  { id: 1, name: "John Smith", email: "john@company.com", phone: "+1 555-0101", company: "Tech Solutions Inc.", source: "Website", status: "new", notes: "Interested in enterprise plan", created_at: "2026-06-20" },
  { id: 2, name: "Sarah Connor", email: "sarah@cyberdyne.com", phone: "+1 555-0102", company: "Cyberdyne", source: "Referral", status: "contacted", notes: "Discussed preliminary budget", created_at: "2026-06-21" },
  { id: 3, name: "Bruce Wayne", email: "bruce@wayne.com", phone: "+1 555-0103", company: "Wayne Ent.", source: "Cold Call", status: "qualified", notes: "Ready for contract review", created_at: "2026-06-22" }
];

let followups = JSON.parse(localStorage.getItem('crm_followups')) || [
  { id: 1, lead_id: 2, date: "2026-06-25T10:00", notes: "Demo call scheduled", status: "pending" }
];

let activities = JSON.parse(localStorage.getItem('crm_activities')) || [
  { id: 1, lead_id: 1, type: "System", notes: "Lead Created", date: "2026-06-20 10:00" },
  { id: 2, lead_id: 2, type: "Email", notes: "Sent intro pricing catalog", date: "2026-06-21 14:30" }
];

let currentUser = JSON.parse(localStorage.getItem('crm_user')) || null;
let charts = {};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  if (!currentUser) {
    document.getElementById("auth-modal").classList.add("active");
  } else {
    document.getElementById("auth-modal").classList.remove("active");
    document.getElementById("user-display-name").innerText = `Welcome, ${currentUser.email}`;
  }

  setupNavigation();
  setupAuth();
  setupDragAndDrop();
  renderAll();
});

function saveData() {
  localStorage.setItem('crm_leads', JSON.stringify(leads));
  localStorage.setItem('crm_followups', JSON.stringify(followups));
  localStorage.setItem('crm_activities', JSON.stringify(activities));
}

// --- Navigation ---
function setupNavigation() {
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav-links li").forEach(li => li.classList.remove("active"));
      link.parentElement.classList.add("active");

      const sectionId = link.getAttribute("data-section");
      document.querySelectorAll(".content-section").forEach(sec => sec.classList.remove("active"));
      document.getElementById(sectionId).classList.add("active");

      renderAll();
    });
  });

  document.getElementById("dark-mode-toggle").addEventListener("click", () => {
    const theme = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", theme);
  });
}

// --- Authentication Simulation ---
function setupAuth() {
  const authForm = document.getElementById("auth-form");
  const toggleAuth = document.getElementById("toggle-auth");
  let isLogin = true;

  if (toggleAuth) {
    toggleAuth.onclick = (e) => {
      e.preventDefault();
      isLogin = !isLogin;
      document.getElementById("auth-subtitle").innerText = isLogin ? "Login to access your sales pipeline" : "Create an account";
      document.getElementById("auth-btn").innerText = isLogin ? "Login" : "Register";
      document.getElementById("auth-toggle-text").innerHTML = isLogin ? 
        'Don\'t have an account? <a href="#" id="toggle-auth">Register</a>' : 
        'Already have an account? <a href="#" id="toggle-auth">Login</a>';
      setupAuth();
    };
  }

  authForm.onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value;
    currentUser = { email };
    localStorage.setItem('crm_user', JSON.stringify(currentUser));
    document.getElementById("user-display-name").innerText = `Welcome, ${currentUser.email}`;
    closeModal("auth-modal");
  };

  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem('crm_user');
    currentUser = null;
    document.getElementById("auth-modal").classList.add("active");
  });
}

// --- Lead Scoring ---
function calculateLeadScore(lead) {
  let score = 10;
  if (lead.status === 'contacted') score += 20;
  if (lead.status === 'qualified') score += 40;
  if (lead.status === 'converted') score += 80;
  if (lead.source === 'Referral') score += 15;
  if (lead.notes && lead.notes.length > 20) score += 5;
  return score;
}

// --- Render Functions ---
function renderAll() {
  renderMetrics();
  renderLeadsTable();
  renderKanban();
  renderFollowups();
  renderCharts();
}

function renderMetrics() {
  const total = leads.length;
  const contacted = leads.filter(l => l.status === 'contacted').length;
  const qualified = leads.filter(l => l.status === 'qualified').length;
  const converted = leads.filter(l => l.status === 'converted').length;
  const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

  document.getElementById("stat-total").innerText = total;
  document.getElementById("stat-contacted").innerText = contacted;
  document.getElementById("stat-qualified").innerText = qualified;
  document.getElementById("stat-converted").innerText = converted;
  document.getElementById("stat-rate").innerText = `${rate}%`;
}

function renderLeadsTable() {
  const tbody = document.getElementById("leads-table-body");
  tbody.innerHTML = "";

  const search = document.getElementById("lead-search").value.toLowerCase();
  const statusFilter = document.getElementById("status-filter").value;
  const sourceFilter = document.getElementById("source-filter").value;

  const filtered = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search) || l.email.toLowerCase().includes(search) || l.company.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || l.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  filtered.forEach(lead => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${calculateLeadScore(lead)}</strong></td>
      <td><a href="#" onclick="viewLeadDetail(${lead.id}); return false;">${lead.name}</a></td>
      <td>${lead.company}</td>
      <td>${lead.email}<br><small>${lead.phone}</small></td>
      <td>${lead.source}</td>
      <td><span class="badge status-${lead.status}">${lead.status.toUpperCase()}</span></td>
      <td>
        <button class="btn btn-icon" onclick="openEditLeadModal(${lead.id})" title="Edit Lead"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-icon" onclick="quickConvert(${lead.id})" title="Convert to Customer"><i class="fa-solid fa-user-check"></i></button>
        <button class="btn btn-icon" onclick="deleteLead(${lead.id})" title="Delete Lead"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterLeads() {
  renderLeadsTable();
}

// --- Kanban Drag & Drop ---
function renderKanban() {
  const statuses = ['new', 'contacted', 'qualified', 'lost', 'converted'];
  statuses.forEach(status => {
    const container = document.getElementById(`kanban-${status}`);
    if (container) {
      container.innerHTML = "";
      leads.filter(l => l.status === status).forEach(lead => {
        const card = document.createElement("div");
        card.className = "kanban-card";
        card.draggable = true;
        card.dataset.id = lead.id;
        card.innerHTML = `
          <strong>${lead.name}</strong>
          <p><small>${lead.company}</small></p>
        `;
        card.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", lead.id));
        container.appendChild(card);
      });
    }
  });
}

function setupDragAndDrop() {
  document.querySelectorAll(".kanban-column").forEach(col => {
    col.addEventListener("dragover", (e) => e.preventDefault());
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const status = col.dataset.status;
      const lead = leads.find(l => l.id == id);
      if (lead) {
        lead.status = status;
        logActivity(lead.id, "Status Change", `Status moved to ${status}`);
        saveData();
        renderAll();
      }
    });
  });
}

// --- Lead CRUD Operations ---
function openAddLeadModal() {
  document.getElementById("lead-form").reset();
  document.getElementById("lead-id").value = "";
  document.getElementById("lead-modal-title").innerText = "Add New Lead";
  document.getElementById("lead-modal").classList.add("active");
}

function openEditLeadModal(id) {
  const lead = leads.find(l => l.id === id);
  if (!lead) return;

  document.getElementById("lead-id").value = lead.id;
  document.getElementById("lead-name").value = lead.name || "";
  document.getElementById("lead-email").value = lead.email || "";
  document.getElementById("lead-phone").value = lead.phone || "";
  document.getElementById("lead-company").value = lead.company || "";
  document.getElementById("lead-source").value = lead.source || "Website";
  document.getElementById("lead-status").value = lead.status || "new";
  document.getElementById("lead-notes").value = lead.notes || "";

  document.getElementById("lead-modal-title").innerText = "Edit Lead";
  document.getElementById("lead-modal").classList.add("active");
}

document.getElementById("lead-form").onsubmit = (e) => {
  e.preventDefault();
  const id = document.getElementById("lead-id").value;
  const leadData = {
    name: document.getElementById("lead-name").value,
    email: document.getElementById("lead-email").value,
    phone: document.getElementById("lead-phone").value,
    company: document.getElementById("lead-company").value,
    source: document.getElementById("lead-source").value,
    status: document.getElementById("lead-status").value,
    notes: document.getElementById("lead-notes").value,
  };

  if (id) {
    const leadIndex = leads.findIndex(l => l.id == id);
    if (leadIndex !== -1) {
      leads[leadIndex] = { ...leads[leadIndex], ...leadData };
      logActivity(parseInt(id), "Update", "Lead details updated");
    }
  } else {
    const newLead = { id: Date.now(), ...leadData, created_at: new Date().toISOString().split('T')[0] };
    leads.push(newLead);
    logActivity(newLead.id, "System", "Lead Created");
  }

  saveData();
  closeModal("lead-modal");
  renderAll();
};

function deleteLead(id) {
  if (confirm("Are you sure you want to delete this lead?")) {
    leads = leads.filter(l => l.id !== id);
    saveData();
    renderAll();
  }
}

function quickConvert(id) {
  const lead = leads.find(l => l.id === id);
  if (lead) {
    lead.status = "converted";
    logActivity(lead.id, "Conversion", "Lead converted to customer with 1-click");
    saveData();
    renderAll();
  }
}

// --- Lead Detail & Activity Timeline ---
function viewLeadDetail(id) {
  const lead = leads.find(l => l.id === id);
  if (!lead) return;

  const leadActivities = activities.filter(a => a.lead_id === id);
  const detailContent = document.getElementById("detail-content");

  detailContent.innerHTML = `
    <h2>${lead.name} <span class="badge status-${lead.status}">${lead.status}</span></h2>
    <p><strong>Company:</strong> ${lead.company} | <strong>Source:</strong> ${lead.source}</p>
    <p><strong>Email:</strong> ${lead.email} | <strong>Phone:</strong> ${lead.phone}</p>
    <p><strong>Notes:</strong> ${lead.notes || 'None'}</p>
    <hr style="margin:15px 0;">
    <div style="margin-bottom:15px;">
      <button class="btn btn-secondary" onclick="openCommModal(${lead.id}, 'Email')"><i class="fa-solid fa-envelope"></i> Send Email</button>
      <button class="btn btn-secondary" onclick="openCommModal(${lead.id}, 'SMS')"><i class="fa-solid fa-comment-sms"></i> Send SMS</button>
    </div>
    <h3>Activity Timeline</h3>
    <ul class="activity-list">
      ${leadActivities.map(a => `
        <li class="activity-item">
          <strong>[${a.type}]</strong> ${a.notes} <br>
          <small>${a.date}</small>
        </li>
      `).join('')}
    </ul>
  `;

  document.getElementById("detail-modal").classList.add("active");
}

function logActivity(leadId, type, notes) {
  activities.unshift({
    id: Date.now(),
    lead_id: leadId,
    type: type,
    notes: notes,
    date: new Date().toLocaleString()
  });
}

// --- Communication Simulation ---
function openCommModal(leadId, type) {
  const lead = leads.find(l => l.id === leadId);
  document.getElementById("comm-lead-id").value = leadId;
  document.getElementById("comm-type").value = type;
  document.getElementById("comm-recipient").value = type === 'Email' ? lead.email : lead.phone;
  document.getElementById("comm-title").innerText = `Send ${type} to ${lead.name}`;
  document.getElementById("comm-modal").classList.add("active");
}

document.getElementById("comm-form").onsubmit = (e) => {
  e.preventDefault();
  const leadId = parseInt(document.getElementById("comm-lead-id").value);
  const type = document.getElementById("comm-type").value;
  const msg = document.getElementById("comm-message").value;

  logActivity(leadId, type, `Simulated ${type}: "${msg}"`);
  saveData();
  closeModal("comm-modal");
  viewLeadDetail(leadId);
};

// --- Follow-up Scheduler ---
function renderFollowups() {
  const select = document.getElementById("followup-lead-id");
  if (select) {
    select.innerHTML = leads.map(l => `<option value="${l.id}">${l.name} (${l.company})</option>`).join('');
  }

  const list = document.getElementById("followup-list");
  if (list) {
    list.innerHTML = followups.map(f => {
      const lead = leads.find(l => l.id === f.lead_id);
      return `
        <li class="activity-item">
          <strong>${lead ? lead.name : 'Unknown'}</strong> - ${new Date(f.date).toLocaleString()}<br>
          <small>${f.notes}</small>
        </li>
      `;
    }).join('');
  }
}

document.getElementById("followup-form").onsubmit = (e) => {
  e.preventDefault();
  const leadId = parseInt(document.getElementById("followup-lead-id").value);
  const date = document.getElementById("followup-date").value;
  const notes = document.getElementById("followup-notes").value;

  followups.push({ id: Date.now(), lead_id: leadId, date, notes, status: "pending" });
  logActivity(leadId, "Follow-up", `Scheduled follow-up for ${date}`);
  saveData();
  renderFollowups();
  document.getElementById("followup-form").reset();
};

// --- CSV Export ---
function exportLeadsCSV() {
  let csv = "ID,Name,Email,Phone,Company,Source,Status,Notes,Created At\n";
  leads.forEach(l => {
    csv += `"${l.id}","${l.name}","${l.email}","${l.phone}","${l.company}","${l.source}","${l.status}","${l.notes}","${l.created_at}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'leads_export.csv');
  a.click();
}

// --- Data Visualization (Charts) ---
function renderCharts() {
  const elPipeline = document.getElementById('pipelineChart');
  const elSource = document.getElementById('sourceChart');
  const elConversion = document.getElementById('conversionReportChart');
  const elEfficiency = document.getElementById('sourceEfficiencyChart');

  if (!elPipeline || !elSource || !elConversion || !elEfficiency) return;

  const ctxPipeline = elPipeline.getContext('2d');
  const ctxSource = elSource.getContext('2d');
  const ctxConversion = elConversion.getContext('2d');
  const ctxEfficiency = elEfficiency.getContext('2d');

  if (charts.pipeline) charts.pipeline.destroy();
  if (charts.source) charts.source.destroy();
  if (charts.conversion) charts.conversion.destroy();
  if (charts.efficiency) charts.efficiency.destroy();

  const statusCounts = ['new', 'contacted', 'qualified', 'lost', 'converted'].map(s => leads.filter(l => l.status === s).length);
  const sources = ['Website', 'Referral', 'Cold Call', 'Social Media'];
  const sourceCounts = sources.map(src => leads.filter(l => l.source === src).length);

  charts.pipeline = new Chart(ctxPipeline, {
    type: 'bar',
    data: {
      labels: ['New', 'Contacted', 'Qualified', 'Lost', 'Converted'],
      datasets: [{ label: 'Leads', data: statusCounts, backgroundColor: ['#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981'] }]
    }
  });

  charts.source = new Chart(ctxSource, {
    type: 'doughnut',
    data: {
      labels: sources,
      datasets: [{ data: sourceCounts, backgroundColor: ['#059669', '#10B981', '#34D399', '#6EE7B7'] }]
    }
  });

  charts.conversion = new Chart(ctxConversion, {
    type: 'pie',
    data: {
      labels: ['Converted', 'Other'],
      datasets: [{ data: [leads.filter(l => l.status === 'converted').length, leads.filter(l => l.status !== 'converted').length], backgroundColor: ['#10B981', '#E5E7EB'] }]
    }
  });

  charts.efficiency = new Chart(ctxEfficiency, {
    type: 'polarArea',
    data: {
      labels: sources,
      datasets: [{ data: sourceCounts, backgroundColor: ['#059669', '#3B82F6', '#F59E0B', '#8B5CF6'] }]
    }
  });
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}