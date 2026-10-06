import ExpoModulesCore
import Foundation

/// The iCloud key-value store (NSUbiquitousKeyValueStore): a few small values that iOS copies to
/// every device signed in to the same iCloud account. Used to share the game progress.
public class CloudKvModule: Module {
  private var observer: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("CloudKv")

    Events("onChange")

    // Another device changed a value (or iCloud sent this device's values for the first time).
    OnStartObserving("onChange") {
      self.observer = NotificationCenter.default.addObserver(
        forName: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
        object: NSUbiquitousKeyValueStore.default,
        queue: .main
      ) { [weak self] note in
        let reason = note.userInfo?[NSUbiquitousKeyValueStoreChangeReasonKey] as? Int ?? -1
        let keys = note.userInfo?[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String] ?? []
        self?.sendEvent("onChange", ["reason": reason, "keys": keys])
      }
      NSUbiquitousKeyValueStore.default.synchronize()
    }

    OnStopObserving("onChange") {
      if let observer = self.observer {
        NotificationCenter.default.removeObserver(observer)
        self.observer = nil
      }
    }

    AsyncFunction("getAsync") { (key: String) -> String? in
      NSUbiquitousKeyValueStore.default.synchronize()
      return NSUbiquitousKeyValueStore.default.string(forKey: key)
    }

    AsyncFunction("setAsync") { (key: String, value: String) in
      NSUbiquitousKeyValueStore.default.set(value, forKey: key)
      NSUbiquitousKeyValueStore.default.synchronize()
    }
  }
}
