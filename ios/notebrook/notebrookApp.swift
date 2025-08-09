//
//  notebrookApp.swift
//  notebrook
//
//  Created by oriol gomez Sentis on 27/8/24.
//

import SwiftUI
import SwiftData
var dataManager = DataManager()

@main
struct notebrookApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView(dataManager: dataManager)
        }
        .modelContainer(for: [Channel.self, Message.self, OutboxItem.self])
    }
}
