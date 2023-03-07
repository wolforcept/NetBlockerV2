#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use winfw::{
    del_fw_rule, disable_fw_rule, enable_fw_rule, get_fw_rules, new_fw_rule, Actions, Directions,
    FwRule, Protocols,
};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_rules() -> Vec<FwRule> {
    let mut list: Vec<FwRule> = Vec::new();

    let rules = get_fw_rules();
    match rules {
        Err(rules) => println!("Error: {}", rules),
        Ok(rules) => {
            for rule in rules.iter() {
                let name = rule.name.to_owned();
                if name.starts_with("NetBlockerRule_") {
                    list.push(rule.to_owned());
                }
            }
        }
    }
    list.sort_by(|a, b| a.app_name.to_lowercase().cmp(&b.app_name.to_lowercase()));
    list
}

#[tauri::command]
fn enable_rule(rule_name: String) -> String {
    match enable_fw_rule(&rule_name) {
        Err(error) => error.to_string(),
        Ok(()) => "".to_owned(),
    }
}

#[tauri::command]
fn disable_rule(rule_name: String) -> String {
    match disable_fw_rule(&rule_name) {
        Err(error) => error.to_string(),
        Ok(()) => "".to_owned(),
    }
}

#[tauri::command]
fn delete_rule(rule_name: String) -> String {
    match del_fw_rule(&rule_name) {
        Err(error) => error.to_string(),
        Ok(()) => "".to_owned(),
    }
}

#[tauri::command]
fn create_rule(path: String, is_out: bool) -> String {
    let direction = if is_out {
        Directions::Out
    } else {
        Directions::In
    };

    let name = if is_out {
        "NetBlockerRule_Outbound_".to_owned() + &path
    } else {
        "NetBlockerRule_Inbound_".to_owned() + &path
    };

    let new_rule = FwRule {
        action: Actions::Block,
        app_name: path.to_owned(),
        description: "A NetBlocker Rule".to_string(),
        direction,
        edge_traversal: false,
        enabled: true,
        grouping: "".to_string(),
        icmp_type: "".to_string(),
        interface_types: "All".to_string(),
        interfaces: "".to_string(),
        local_adresses: "*".to_string(),
        local_ports: "".to_string(),
        name,
        profile1: "".to_string(),
        profile2: "".to_string(),
        profile3: "".to_string(),
        protocol: Protocols::Any,
        remote_addresses: "*".to_string(),
        remote_ports: "".to_string(),
        service_name: "".to_string(),
    };

    match new_fw_rule(&new_rule) {
        Err(error) => error.to_string(),
        Ok(()) => "".to_owned(),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_rules,
            enable_rule,
            disable_rule,
            create_rule,
            delete_rule,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
