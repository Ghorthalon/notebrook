import SwiftUI

struct ChannelSelector: View {
    @State var dataManager: DataManager
    @State private var viewModel = ViewModel()
    
    var body: some View {
        VStack {
            if viewModel.channels.count < 1 {
                Text("Retrieving channels...")
            } else {
                Text("Found some channels \(viewModel.channels)")
            }
        }
            .task({
                print("hey")
                viewModel.channels = await viewModel.getChannelList()
                print(viewModel.channels)
                print("done")
            })

    }
}
