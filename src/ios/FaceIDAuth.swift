import Foundation
import LocalAuthentication
import SwiftUI

class BiometricAuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var authError: String? = nil
    
    // Запрос авторизации Face ID / Touch ID для интеграции с Apple Wallet или входом в банк
    func authenticateUser(reason: String = "Підтвердіть вашу особу для доступу до NovaBank", completion: @escaping (Bool) -> Void) {
        let context = LAContext()
        var error: NSError?
        
        // Проверяем, доступны ли биометрические датчики на устройстве (Face ID / Touch ID)
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            
            // Выполняем запрос к Secure Enclave
            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, evaluateError in
                DispatchQueue.main.async {
                    if success {
                        self.isAuthenticated = true
                        self.authError = nil
                        completion(true)
                    } else {
                        self.isAuthenticated = false
                        self.authError = self.handleBiometricError(error: evaluateError)
                        completion(false)
                    }
                }
            }
        } else {
            // Биометрия недоступна (не настроена, или старое устройство)
            // Фолбек на ввод код-пароля
            DispatchQueue.main.async {
                self.authError = "Face ID недоступний. Будь ласка, використовуйте PIN-код."
                self.fallbackToPasscode(context: context, reason: reason, completion: completion)
            }
        }
    }
    
    // Резервный метод: авторизация по код-паролю (Device Passcode)
    private func fallbackToPasscode(context: LAContext, reason: String, completion: @escaping (Bool) -> Void) {
        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { success, evaluateError in
            DispatchQueue.main.async {
                if success {
                    self.isAuthenticated = true
                    self.authError = nil
                    completion(true)
                } else {
                    self.isAuthenticated = false
                    self.authError = self.handleBiometricError(error: evaluateError)
                    completion(false)
                }
            }
        }
    }
    
    // Обработка кодов ошибок Apple LocalAuthentication
    private func handleBiometricError(error: Error?) -> String {
        guard let laError = error as? LAError else {
            return "Невідома помилка авторизації."
        }
        
        switch laError.code {
        case .authenticationFailed:
            return "Обличчя не розпізнано."
        case .userCancel:
            return "Авторизацію скасовано."
        case .userFallback:
            return "Вибрано введення пароля."
        case .biometryNotAvailable:
            return "Face ID не підтримується на цьому пристрої."
        case .biometryNotEnrolled:
            return "Face ID не налаштовано."
        case .biometryLockout:
            return "Face ID заблоковано через занадто багато невдалих спроб."
        default:
            return "Помилка доступу: \(laError.localizedDescription)"
        }
    }
}

// Пример интеграции во View
struct TransferConfirmationView: View {
    @StateObject private var authManager = BiometricAuthManager()
    @State private var showSuccess = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Переказ 500 ₴")
                .font(.title)
                .bold()
            
            Button(action: {
                // Вызываем FaceID перед отправкой транзакции
                authManager.authenticateUser(reason: "Підтвердіть переказ 500 ₴") { success in
                    if success {
                        // Разблокируем Apple Wallet / Отправляем запрос на Fastify бэкенд
                        performWalletIntegration()
                        showSuccess = true
                    }
                }
            }) {
                HStack {
                    Image(systemName: "faceid")
                    Text("Підтвердити через Face ID")
                }
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            
            if let error = authManager.authError {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            if showSuccess {
                Text("✅ Переказ успішно надіслано!")
                    .foregroundColor(.green)
                    .transition(.opacity)
            }
        }
    }
    
    func performWalletIntegration() {
        // Здесь происходит вызов PassKit (PKAddPassesViewController)
        // и отправка подписанной транзакции на сервер
        print("Транзакция отправлена в Secure Enclave Apple Wallet")
    }
}
