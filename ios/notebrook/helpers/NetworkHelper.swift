import Network

func checkInternetConnection(completion: @escaping (Bool) -> Void) {
    let monitor = NWPathMonitor()
    let queue = DispatchQueue.global(qos: .background)
    
    monitor.pathUpdateHandler = { path in
        if path.status == .satisfied {
            completion(true)
        } else {
            completion(false)
        }
        monitor.cancel() // Stop monitoring after the first check
    }
    
    monitor.start(queue: queue)
}

