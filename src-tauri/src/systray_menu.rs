use lazy_static::lazy_static;
use std::collections::{HashMap, HashSet};
use std::sync::Mutex;
use tauri::{AppHandle, CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem, SystemTraySubmenu};

lazy_static! {
    pub static ref TRAY_MENU_ITEMS: Mutex<HashMap<String, CustomMenuItem>> = Mutex::new({
        let mut map = HashMap::new();
        map.insert("minimize".to_string(), CustomMenuItem::new("minimize".to_string(), "Minimize to Tray"));
        map.insert("exit".to_string(), CustomMenuItem::new("quit".to_string(), "Exit"));
        // Add other initial menu items here
        map
    });

    static ref SUBMENU_ITEMS: Mutex<HashMap<String, HashSet<String>>> = Mutex::new({
        let map = HashMap::new();
        // Add initial submenu items here if needed
        map
    });
}

pub fn add_systray_menu_item(app_handle: &AppHandle, item_id: String, item_label: String) {
    add_or_update_menu_item(app_handle, item_id, item_label);
}

pub fn add_systray_menu_submenu_item(
    app_handle: &AppHandle,
    submenu_id: String,
    item_id: String,
    item_label: String,
) {
    add_or_update_submenu_item(app_handle, submenu_id, item_id, item_label);
}

pub fn remove_systray_menu_item(app_handle: &AppHandle, item_id: String) {
    remove_menu_item(app_handle, item_id);
}

pub fn remove_systray_submenu_item(app_handle: &AppHandle, submenu_id: String, item_id: String) {
    remove_submenu_item(app_handle, submenu_id, item_id);
}

fn add_or_update_menu_item(app_handle: &AppHandle, item_id: String, item_label: String) {
    let mut tray_menu_items = TRAY_MENU_ITEMS.lock().unwrap();
    let submenu_items = SUBMENU_ITEMS.lock().unwrap();

    // Update or add the menu item
    let item = CustomMenuItem::new(item_id.clone(), item_label);
    tray_menu_items.insert(item_id.clone(), item);

    // Rebuild the system tray menu
    let tray_menu = build_system_tray_menu(&tray_menu_items, &submenu_items);

    // Set the updated menu
    let _ = app_handle.tray_handle().set_menu(tray_menu);
}

fn add_or_update_submenu_item(
    app_handle: &AppHandle,
    submenu_id: String,
    item_id: String,
    item_label: String,
) {
    let _ = item_label;
    let tray_menu_items = TRAY_MENU_ITEMS.lock().unwrap();
    let mut submenu_items = SUBMENU_ITEMS.lock().unwrap();

    // Find or create the submenu
    let submenu = submenu_items
        .entry(submenu_id.clone())
        .or_insert_with(HashSet::new);

    // Add the item to the submenu
    submenu.insert(item_id.clone());

    // Rebuild the system tray menu
    let tray_menu = build_system_tray_menu(&tray_menu_items, &submenu_items);

    // Set the updated menu
    let _ = app_handle.tray_handle().set_menu(tray_menu);
}

fn remove_menu_item(app_handle: &AppHandle, item_id: String) {
    let mut tray_menu_items = TRAY_MENU_ITEMS.lock().unwrap();
    let mut submenu_items = SUBMENU_ITEMS.lock().unwrap();

    // Remove the item from the menu items
    tray_menu_items.remove(&item_id);

    // Remove the item from any submenus
    for (_, submenu) in submenu_items.iter_mut() {
        submenu.remove(&item_id);
    }

    // Rebuild the system tray menu
    let tray_menu = build_system_tray_menu(&tray_menu_items, &submenu_items);

    // Set the updated menu
    let _ = app_handle.tray_handle().set_menu(tray_menu);
}

fn remove_submenu_item(app_handle: &AppHandle, submenu_id: String, item_id: String) {
    let tray_menu_items = TRAY_MENU_ITEMS.lock().unwrap();
    let mut submenu_items = SUBMENU_ITEMS.lock().unwrap();

    // Remove the item from the submenu
    if let Some(submenu) = submenu_items.get_mut(&submenu_id) {
        submenu.remove(&item_id);
    }

    // Rebuild the system tray menu
    let tray_menu = build_system_tray_menu(&tray_menu_items, &submenu_items);

    // Set the updated menu
    let _ = app_handle.tray_handle().set_menu(tray_menu);
}

fn build_system_tray_menu(
    items: &HashMap<String, CustomMenuItem>,
    submenus: &HashMap<String, HashSet<String>>,
) -> SystemTrayMenu {
    let mut tray_menu = SystemTrayMenu::new();

    for (item_id, item) in items {
        if let Some(submenu_ids) = submenus.get(item_id) {
            // Item has associated submenus
            let mut submenu =
                SystemTraySubmenu::new("Submenu Title".to_string(), SystemTrayMenu::new());

            for submenu_id in submenu_ids {
                if let Some(submenu_item) = items.get(submenu_id) {
                    submenu.inner = submenu.inner.add_item(submenu_item.clone());
                }
            }

            tray_menu = tray_menu.add_submenu(submenu);
        } else {
            // Item doesn't have submenus
            if item_id == "minimize" || item_id == "exit" {
                // Don't process minimize or exit as we'll add them manually at the end so the ordering is correct
                continue;
            }

            tray_menu = tray_menu.add_item(item.clone());
        }
    }

    // Count the items in the tray_menu
    let item_count = tray_menu.items.len();

    // Add a separator only if there are items that have been added
    if item_count > 0 {
        tray_menu = tray_menu.add_native_item(SystemTrayMenuItem::Separator);
    }

    let minimize_item = CustomMenuItem::new("minimize".to_string(), "Minimize to Tray");
    tray_menu = tray_menu.add_item(minimize_item);

    let exit_item = CustomMenuItem::new("exit".to_string(), "Exit");
    tray_menu = tray_menu.add_item(exit_item);

    tray_menu
}
