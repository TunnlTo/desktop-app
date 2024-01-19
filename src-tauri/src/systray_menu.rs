use lazy_static::lazy_static;
use std::collections::{HashMap, HashSet};
use std::sync::Mutex;
use tauri::{AppHandle, CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem, SystemTraySubmenu};

lazy_static! {
    pub static ref TRAY_MENU_ITEMS: Mutex<HashMap<String, CustomMenuItem>> = Mutex::new({
        let map = HashMap::new();
        map
    });
    pub static ref CONNECT_MENU_ITEMS: Mutex<HashSet<String>> = Mutex::new(HashSet::new());
}

pub fn add_or_update_systray_menu_item(app_handle: &AppHandle, item_id: String, item_label: String) {
    println!("Adding menu item");

    let mut tray_menu_items = TRAY_MENU_ITEMS.lock().unwrap();
    let connect_menu_items = CONNECT_MENU_ITEMS.lock().unwrap();

    // Update or add the menu item
    let item = CustomMenuItem::new(item_id.clone(), item_label);
    tray_menu_items.insert(item_id.clone(), item);

    // Rebuild the system tray menu
    let tray_menu = build_systray_menu(&tray_menu_items, &connect_menu_items);

    // Set the updated menu
    let _ = app_handle.tray_handle().set_menu(tray_menu);
}

pub fn update_systray_connect_menu_items(app_handle: &AppHandle, items: Vec<(String, String)>) {
    println!("Updating 'Connect' submenu items");

    let mut tray_menu_items = TRAY_MENU_ITEMS.lock().unwrap();
    let mut connect_menu_items = CONNECT_MENU_ITEMS.lock().unwrap();

    // Clear existing 'Connect' submenu items
    connect_menu_items.clear();

    // Update or add new 'Connect' submenu items
    for (item_id, item_label) in items {
        let item = CustomMenuItem::new(item_id.clone(), item_label.clone());
        tray_menu_items.insert(item_id.clone(), item);
        connect_menu_items.insert(item_id);
    }

    // Remove items from TRAY_MENU_ITEMS that are not in the updated connect_menu_items
    // and are not one of the special items like "exit", "minimize", or "disconnect"
    tray_menu_items.retain(|item_id, _| {
        connect_menu_items.contains(item_id)
            || *item_id == "disconnect"
    });

    // Rebuild the system tray menu
    let tray_menu = build_systray_menu(&tray_menu_items, &connect_menu_items);

    // Set the updated menu
    let _ = app_handle.tray_handle().set_menu(tray_menu);
}

pub fn remove_systray_menu_item(app_handle: &AppHandle, item_id: String) {
    let mut tray_menu_items = TRAY_MENU_ITEMS.lock().unwrap();
    let connect_menu_items = CONNECT_MENU_ITEMS.lock().unwrap();

    // Remove the item from the menu items
    tray_menu_items.remove(&item_id);

    // Rebuild the system tray menu
    let tray_menu = build_systray_menu(&tray_menu_items, &connect_menu_items);

    // Set the updated menu
    let _ = app_handle.tray_handle().set_menu(tray_menu);
}

fn build_systray_menu(
    items: &HashMap<String, CustomMenuItem>,
    connect_items: &HashSet<String>,
) -> SystemTrayMenu {
    let mut tray_menu = SystemTrayMenu::new();

    // Add 'Connect' submenu if there are items
    if !connect_items.is_empty() {
        let mut connect_menu = SystemTrayMenu::new();
        for item_id in connect_items {
            if let Some(item) = items.get(item_id) {
                connect_menu = connect_menu.add_item(item.clone());
            }
        }
        let connect_submenu = SystemTraySubmenu::new("Connect".to_string(), connect_menu);
        tray_menu = tray_menu.add_submenu(connect_submenu);
    }

    // Add other items to the tray menu (disconnect etc.)
    for (item_id, item) in items {
        if item_id != "minimize" && item_id != "exit" && !connect_items.contains(item_id) {
            tray_menu = tray_menu.add_item(item.clone());
        }
    }

    // Count the items in the tray_menu
    let item_count = tray_menu.items.len();

    // Add a separator if the connect menu exists. This handles no tunnels existing.
    if item_count > 0 {
        tray_menu = tray_menu.add_native_item(SystemTrayMenuItem::Separator);
    }

    // Manually add the 'Minimize to Tray' and 'Exit' items at the bottom of the menu
    let minimize_item = CustomMenuItem::new("minimize".to_string(), "Minimize to Tray".to_string());
    tray_menu = tray_menu.add_item(minimize_item);
    let exit_item = CustomMenuItem::new("exit".to_string(), "Exit".to_string());
    tray_menu = tray_menu.add_item(exit_item);

    tray_menu
}
