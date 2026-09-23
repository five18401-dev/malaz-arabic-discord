"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const fmt = (value) => new Intl.NumberFormat("ar-SA").format(Number(value || 0));
const voiceTime = (minutes) => `${fmt(Math.floor(Number(minutes || 0) / 60))} س ${fmt(Number(minutes || 0) % 60)} د`;

let members = [];
let selected = null;
let board = "chat";

const fallbackRanks = [
  { level: "LVL 40+", name: "الملاذ الملكي", icon: "♛", color: "#f1c96d", desc: "أعلى رتبة تقديرية لأكثر الأعضاء تأثيراً وحضوراً." },
  { level: "LVL 35+", name: "أسطورة ملاذ", icon: "✦", color: "#c58aff", desc: "رتبة نادرة للأعضاء الذين تركوا بصمتهم في المجتمع." },
  { level: "LVL 30+", name: "المشرف", icon: "◆", color: "#6dc7f1", desc: "أعضاء موثوقون يساعدون في تنظيم وتطوير المجتمع." },
  { level: "LVL 25+", name: "الذهبي", icon: "◈", color: "#e2a958", desc: "عضو متفاعل يساهم باستمرار في مختلف قنوات ملاذ." },
  { level: "LVL 15+", name: "الفضي", icon: "◇", color: "#b8c4d2", desc: "مرحلة التقدم الأولى للأعضاء النشطين في المجتمع." },
  { level: "LVL 1+", name: "عضو ملاذ", icon: "○", color: "#8c8d96", desc: "الرتبة الأساسية لكل عضو جديد في السيرفر." }
];

function toast(message) {
  const element = $("#toast");
  if (!element) return;
  const text = element.querySelector("span");
  if (text) text.textContent = message;
  element.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => element.classList.remove("show"), 2500);
}

function normalizeMember(member) {
  return {
    ...member,
    username: member.username?.startsWith("@") ? member.username : `@${member.username || member.id}`,
    joined: member.joined || (member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("ar-SA") : "غير معروف"),
    messages: Number(member.messages || 0),
    voice: Number(member.voice || 0),
    xp: Number(member.xp || 0),
    level: Number(member.level || 1),
    rank: member.rank || "عضو ملاذ"
  };
}

function renderMember(member) {
  if (!member) return;
  selected = member;
  const set = (selector, value) => { const el = $(selector); if (el) el.textContent = value; };
  set("#titleName", member.name);
  const name = $("#name");
  if (name) name.innerHTML = `${member.name} <sup>✓</sup>`;
  set("#username", member.username);
  set("#joined", member.joined);
  set("#rank", member.rank);
  set("#rankPill", member.rank);
  set("#level", member.level);
  set("#levelText", `LVL ${member.level}`);
  set("#messages", fmt(member.messages));
  set("#voice", voiceTime(member.voice));
  set("#xp", fmt(member.xp));
  set("#xpProgress", `${Math.min(100, Math.round((member.xp % 10000) / 100))}%`);
  set("#nextLevel", `المرحلة التالية: LVL ${member.level + 1}`);
  const avatar = $("#avatar");
  if (avatar) avatar.src = member.avatar || "https://cdn.discordapp.com/embed/avatars/0.png";
  const progress = $("#progressFill");
  if (progress) progress.style.width = `${Math.min(100, Math.round((member.xp % 10000) / 100))}%`;
}

function renderSuggestions(term = "") {
  const container = $("#suggestions");
  if (!container) return;
  const query = term.trim().toLowerCase();
  const results = (query ? members.filter((m) => `${m.name} ${m.username}`.toLowerCase().includes(query)) : members).slice(0, 5);
  container.innerHTML = results.map((member) => `<button type="button" data-member-id="${member.id}">${member.name}<small>${member.username}</small></button>`).join("");
  container.querySelectorAll("[data-member-id]").forEach((button) => button.addEventListener("click", () => {
    const member = members.find((item) => item.id === button.dataset.memberId);
    renderMember(member);
    const input = $("#searchInput");
    if (input) input.value = member.name;
  }));
}

function renderBoard() {
  const sorted = [...members].sort((a, b) => board === "voice" ? b.voice - a.voice : b.messages - a.messages);
  const top = sorted[0];
  if (!top) return;
  const topAvatar = $("#topAvatar");
  if (topAvatar) topAvatar.src = top.avatar || "https://cdn.discordapp.com/embed/avatars/0.png";
  const topName = $("#topName");
  if (topName) topName.textContent = top.name;
  const topMeta = $("#topMeta");
  if (topMeta) topMeta.textContent = board === "voice" ? voiceTime(top.voice) : `${fmt(top.messages)} رسالة`;
  const list = $("#boardList");
  if (list) list.innerHTML = sorted.slice(0, 10).map((member, index) => `<li><b>${index + 1}</b><img src="${member.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"}" alt=""><span>${member.name}</span><strong>${board === "voice" ? voiceTime(member.voice) : fmt(member.messages)}</strong></li>`).join("");
}

function renderRanks(roles = []) {
  const list = roles.length ? roles.map((role, index) => ({ level: `LVL ${Math.max(1, roles.length - index)}+`, name: role.name, icon: "◆", color: role.color || "#c58aff", desc: "رتبة من رتب مجتمع ملاذ." })) : fallbackRanks;
  const grid = $("#rankGrid");
  if (grid) grid.innerHTML = list.map((rank) => `<article class="rank" style="--c:${rank.color}"><div class="rank-head"><b class="rank-icon">${rank.icon}</b><small>${rank.level}</small></div><h3>${rank.name}</h3><p>${rank.desc}</p></article>`).join("");
}

async function loadLiveData() {
  if (!window.MalazAPI?.enabled) return;
  try {
    const [membersResponse, rolesResponse] = await Promise.all([window.MalazAPI.members(), window.MalazAPI.roles()]);
    if (Array.isArray(membersResponse.members)) members = membersResponse.members.map(normalizeMember);
    if (members.length) {
      selected = members[0];
      renderMember(selected);
      renderSuggestions();
      renderBoard();
    }
    renderRanks(Array.isArray(rolesResponse.roles) ? rolesResponse.roles : []);
  } catch (error) {
    console.error("Unable to load live Discord data:", error);
    toast("تعذر تحميل بيانات Discord حالياً");
  }
}

$("#searchInput")?.addEventListener("input", (event) => renderSuggestions(event.target.value));
$("#clearSearch")?.addEventListener("click", () => { $("#searchInput").value = ""; renderSuggestions(); });
$$("[data-board]").forEach((button) => button.addEventListener("click", () => {
  board = button.dataset.board;
  $$('[data-board]').forEach((item) => item.classList.toggle("active", item === button));
  renderBoard();
}));

const year = $("#year");
if (year) year.textContent = new Date().getFullYear();
renderRanks();
loadLiveData();
