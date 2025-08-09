//
//  AppView.swift
//  notebrook
//
//  Created by oriol gomez Sentis on 2/1/25.
//

import SwiftUI


struct AppView: View {
    @State var dataManager: DataManager
    @State private var viewModel = ViewModel()
    
    var body: some View {
        VStack {
            ChannelSelector(dataManager: dataManager)
        }

    }
}
