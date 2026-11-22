
document.addEventListener("DOMContentLoaded", () => {
  const quests = document.querySelector(".quests");
  const bar = document.querySelector("#bar");
  const count = document.querySelector(".count");

  if (!quests) return;

  const tasks = [
    "انضم إلى سيرفر الديسكورد",
    "ادعُ صديقًا للسيرفر",
    "شارك في النقاش اليومي",
    "تفاعل مع أعضاء المجتمع",
    "أكمل تحدي اليوم"
  ];

  let completed = JSON.parse(
    localStorage.getItem("questify_completed") || "[]"
  );

  function render() {
    quests.innerHTML = "";

    tasks.forEach((task, index) => {
      const done = completed.includes(index);

      const item = document.createElement("div");
      item.style.cssText =
        "padding:15px;margin:10px 0;background:#20283a;border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;";

      const label = document.createElement("span");
      label.textContent = task;

      const button = document.createElement("button");
      button.textContent = done ? "مكتمل ✓" : "إنجاز";
      button.className = "ghost";
      button.disabled = done;

      button.addEventListener("click", () => {
        completed.push(index);
        localStorage.setItem(
          "questify_completed",
          JSON.stringify(completed)
        );
        render();
      });

      item.append(label, button);
      quests.appendChild(item);
    });

    const percentage = (completed.length / tasks.length) * 100;

    if (bar) bar.style.width = percentage + "%";
    if (count) count.textContent =
      `${completed.length} / ${tasks.length}`;
  }

  render();
});
