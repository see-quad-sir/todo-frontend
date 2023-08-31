const API_URL = "http://127.0.0.1:8080/todos";
let todos = [];
let isNewCreateMode = true;
let isDeleteMode = false;
let selectedTodoId = -1;
let temporalStoredTodoId = -1;

window.addEventListener('DOMContentLoaded', function() {
    const isDark = document.cookie.split('=')[1];
    const themeCheckbox = document.getElementById("theme");
    const themeSwitcherIcon = document.getElementById("theme_switcher_icon");
    if(isDark === 'true') {
        themeCheckbox.checked = true;
        themeSwitcherIcon.textContent = "dark_mode";
    } else {
        themeCheckbox.checked = false;
        themeSwitcherIcon.textContent = "light_mode";
    }

    refreshTodoList();
})

function writeThemeStateInCookie() {
    const themeSwitcherIcon = document.getElementById("theme_switcher_icon");
    const isDark = document.getElementById("theme").checked;
    if(isDark === true) {
        themeSwitcherIcon.textContent = "dark_mode"
    } else {
        themeSwitcherIcon.textContent = "light_mode"
    }
    document.cookie = 'is_dark=' + isDark;
}

async function refreshTodoList() {
    const res = await fetch(API_URL);
    const jsonRes = await res.json();
    if(!isError(jsonRes)) {
        todos = jsonRes["todos"];
        const todoList = document.getElementById("todo_list");
        let nHTML = "";
        for(let i = 0; i < todos.length; i++) {
            nHTML += "<div class=\"todo\"><h3><b>" + todos[i]["title"] + "</b></h3></div>";
        }
        todoList.innerHTML = nHTML;
        setEditEvent();
    }
}

function setEditEvent() {
    const todoElms = document.getElementsByClassName("todo");
    for(let i = 0; i < todoElms.length; i++) {
        todoElms[i].addEventListener("click", () => { editTodo(i) }, false);
    }
}

function editTodo(index) {
    selectedTodoId = todos[index]["id"];
    if(isDeleteMode) {
        const dialog = document.getElementById("dialog");
        //create delete dialog
        document.getElementById("dialog_title").hidden = true;
        document.getElementById("dialog_msg").innerHTML = `「${todos[index]["title"]}」を削除します。<br>よろしいですか？`;
        const dialogBtnConfirm = document.getElementById("dialog_btn_confirm");
        dialogBtnConfirm.textContent = "OK";
        dialogBtnConfirm.addEventListener("click", confirmRemovingTodo);
        dialog.addEventListener("close", () => {
            dialogBtnConfirm.removeEventListener("click", confirmRemovingTodo);
        });
        document.getElementById("dialog_btn_cancel").hidden = false;
        dialog.showModal();
    }
    else {
        isNewCreateMode = false;
        document.getElementById("title").value = todos[index]["title"];
        document.getElementById("detail").value = todos[index]["detail"];
        document.getElementById("date").value = todos[index]["date"];
        document.getElementById("btn_upload").value = "更新";
        countTitleLength();
        countDetailLength();
        document.getElementById("editor_popup").className = "show";
    }
}

function confirmRemovingTodo() {
    deleteTodo(selectedTodoId);
}

async function deleteTodo(id) {
    if(selectedTodoId > -1) {
        const res = await fetch(`${API_URL}/${id}`, {method: "DELETE"});
        const jsonRes = await res.json();
        if(!isError(jsonRes)) {
            refreshTodoList();
            if(selectedTodoId === temporalStoredTodoId) {
                moveToNewCreateMode();
            }
        }
    }
}

function uploadTodo() {
    const dateValue = document.getElementById("date").value === "" ? null : document.getElementById("date").value;
    const requestedTodo = {
        title: document.getElementById("title").value,
        detail: document.getElementById("detail").value,
        date: dateValue,
    };
    if(isNewCreateMode) {
        postTodo(requestedTodo);
    }
    else {
        putTodo(selectedTodoId, requestedTodo);
    }
}

async function postTodo(newTodo) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newTodo)
    });
    const jsonRes = await res.json();
    if(!isError(jsonRes)) {
        refreshTodoList();
        resetForm();
        showSnackbar("登録しました");
    }
    closePopup();
}

async function putTodo(id, modifiedTodo) {
    if(id > -1) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(modifiedTodo)
        });
        const jsonRes = await res.json();
        if(!isError(jsonRes)) {
            refreshTodoList();
            moveToNewCreateMode();
            showSnackbar("更新しました");
        }
    }
    closePopup();
}

function isError(jsonResponse) {
    if(jsonResponse["error_code"] != 0) {
        const dialog = document.getElementById("dialog");
        // create error dialog
        document.getElementById("dialog_title").hidden = false;
        document.getElementById("dialog_msg").textContent = jsonResponse["error_message"];
        document.getElementById("dialog_btn_cancel").hidden = true;
        document.getElementById("dialog_btn_confirm").textContent = "閉じる";
        dialog.showModal();
        return true;
    }
    return false;
}

function showSnackbar(msg) {
    const snackbar = document.getElementById("snackbar");
    snackbar.textContent = msg;
    snackbar.className = "show";
    setTimeout(function(){snackbar.className = snackbar.className.replace("show","");}, 3000);
}

function switchDeleteMode() {
    const trashIcon = document.getElementById("trash_icon");
    const btnUpload = document.getElementById("btn_upload");
    if(!isDeleteMode) {
        temporalStoredTodoId = selectedTodoId;
        trashIcon.textContent = "done";
        trashIcon.title = "完了";
        isDeleteMode = true;
        btnUpload.disabled = "disabled";
        btnUpload.style.background = "lightgray";
    } else {
        selectedTodoId = temporalStoredTodoId;
        trashIcon.textContent = "delete";
        trashIcon.title = "Todo削除";
        isDeleteMode = false;
        switchBtnUploadStatus();
    }
}

function countTitleLength() {
    const titleLengthText = document.getElementById("title_length");
    const titleLength = document.getElementById("title").value.length;
    titleLengthText.textContent = titleLength;
    titleLengthText.style.color = titleLength > 100 ? "red" : null;
    switchBtnUploadStatus();
}

function countDetailLength() {
    const detailLengthText = document.getElementById("detail_length");
    const detailLength = document.getElementById("detail").value.length;
    detailLengthText.textContent = detailLength;
    detailLengthText.style.color = detailLength > 1000 ? "red" : null;
    switchBtnUploadStatus();
}

function resetForm() {
    const titleLengthText = document.getElementById("title_length");
    const detailLengthText = document.getElementById("detail_length");
    const btnUpload = document.getElementById("btn_upload");
    document.getElementById("edit_form").reset();
    titleLengthText.textContent = 0;
    titleLengthText.style.color = null;
    detailLengthText.textContent = 0;
    detailLengthText.style.color = null;
    btnUpload.disabled = "disabled";
    btnUpload.style.background = "lightgray";
}

function moveToNewCreateMode() {
    resetForm();
    document.getElementById("btn_upload").value = "登録";
    isNewCreateMode = true;
    selectedTodoId = -1;
    document.getElementById("editor_popup").className = "show";
}

function switchBtnUploadStatus() {
    const btnUpload = document.getElementById("btn_upload");
    const titleLength = document.getElementById("title").value.length;
    const detailLength = document.getElementById("detail").value.length;
    if(1 <= titleLength && titleLength <= 100 &&
        0 <= detailLength && detailLength <= 1000) {
        btnUpload.disabled = null;
        btnUpload.style.background = "#00aaff";
    } else {
        btnUpload.disabled = "disabled";
        btnUpload.style.background = "lightgray";
    }
}

function closePopup() {
    const editorPopup = document.getElementById("editor_popup");
    document.getElementById("editor_popup").className = "close";
    setTimeout(function(){editorPopup.className = ""}, 250);
}