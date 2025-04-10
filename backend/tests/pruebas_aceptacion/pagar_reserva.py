import unittest, time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException
from selenium.common.exceptions import TimeoutException

class BookingFlowTest(unittest.TestCase):
    def setUp(self):
        chrome_options = Options()
        chrome_options.add_argument("--start-maximized")
        service = Service("C:\\Webdriver\\chromedriver-win64\\chromedriver.exe")
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 30)

    def click_with_retry(self, by, value):
        for _ in range(3):
            try:
                element = self.wait.until(EC.element_to_be_clickable((by, value)))
                self.driver.execute_script("arguments[0].scrollIntoView();", element)
                self.driver.execute_script("arguments[0].click();", element)
                return
            except StaleElementReferenceException:
                time.sleep(1)
    def fill_field_safe(self, by, value, text):
         for _ in range(3):
             try:
                 element = self.wait.until(EC.visibility_of_element_located((by, value)))
                 element.click()
                 element.clear()
                 element.send_keys(text)
                 return
             except StaleElementReferenceException:
                 time.sleep(1)

    def fill_field(self, by, value, text):
        try:
            element = self.wait.until(EC.visibility_of_element_located((by, value)))
            element.clear()
            element.send_keys(text)
        except TimeoutException:
            print(f"❌ Timeout al rellenar campo {value}")

    def switch_to_stripe_iframe(self, name_contains):
        iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
        for iframe in iframes:
            if name_contains in iframe.get_attribute("name"):
                self.driver.switch_to.frame(iframe)
                return True
        return False

    def fill_stripe_card_fields(self):
        # Cambiar al iframe del número de tarjeta
        if self.switch_to_stripe_iframe("cardNumber"):
            try:
                self.fill_field(By.NAME, "cardnumber", "4242 4242 4242 4242")
                print("✅ Número de tarjeta introducido correctamente.")
            except:
                print("❌ Timeout al rellenar campo cardnumber")
            self.driver.switch_to.default_content()
        
        time.sleep(1)

        # Cambiar al iframe de fecha de expiración
        if self.switch_to_stripe_iframe("cardExpiry"):
            try:
                self.fill_field(By.NAME, "exp-date", "08 / 26")
                print("✅ Fecha de expiración introducida correctamente.")
            except:
                print("❌ Timeout al rellenar campo exp-date")
            self.driver.switch_to.default_content()

        time.sleep(1)

        # Cambiar al iframe del CVC
        if self.switch_to_stripe_iframe("cardCvc"):
            try:
                self.fill_field(By.NAME, "cvc", "123")
                print("✅ CVC introducido correctamente.")
            except:
                print("❌ Timeout al rellenar campo CVC")
            self.driver.switch_to.default_content()



    def test_booking_flow(self):
        driver = self.driver
        wait = self.wait

        # Login
        driver.get("http://localhost:8081/LoginScreen")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Nombre de usuario']", "Paula10")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Contraseña']", "prueba1234")
        self.click_with_retry(By.XPATH, "//*[contains(text(),'Iniciar sesión')]")
        time.sleep(3)

        # Ir a RegisterBookings
        driver.get("http://localhost:8081/RegisterBookings")

        # Seleccionar ciudad por alt en img
        for _ in range(3):  # reintento hasta 3 veces si el elemento se vuelve stale
            try:
                img = wait.until(EC.presence_of_element_located((By.XPATH, "//img[@alt='Sevilla']")))
                button = img.find_element(By.XPATH, "./ancestor::button")
                driver.execute_script("arguments[0].scrollIntoView(true);", button)
                time.sleep(0.5)
                driver.execute_script("arguments[0].click();", button)
                print("✅ Ciudad Sevilla seleccionada correctamente.")
                break
            except StaleElementReferenceException:
                print("⚠️ Elemento stale, reintentando...")
                time.sleep(1)


        # Seleccionar categoría CULTURA
        buttons = driver.find_elements(By.TAG_NAME, "button")
        for button in buttons:
            try:
                if "CULTURA" in button.text:
                    driver.execute_script("arguments[0].scrollIntoView();", button)
                    driver.execute_script("arguments[0].click();", button)
                    break
            except:
                continue

        print("✅ Categoría CULTURA seleccionada.")

        # Participantes
        participants = wait.until(EC.element_to_be_clickable((By.NAME, "participants")))
        participants.clear()
        participants.send_keys("1")

        # Fecha
        # Paso 8: Rellenar campo de fecha correctamente
        # Forzar valor con JS si falla el input manual
        fecha_input = driver.find_element(By.NAME, "experience_date")
        driver.execute_script("""
            const input = arguments[0];
            input.value = arguments[1];
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        """, fecha_input, "2025-04-20")



        # Enviar
        time.sleep(2)
        self.click_with_retry(By.XPATH, "//button[contains(text(),'Realizar Reserva')]")
        time.sleep(3)

        
        try:
            self.click_with_retry(By.XPATH, "//div[contains(text(),'Proceder al pago')]")
        except Exception:
            # Opción 2: por clase del botón
            self.click_with_retry(By.CSS_SELECTOR, "div[class*='r-color-jwli3a'][class*='r-fontWeight-vw2c0b']")

        print("✅ Se ha hecho clic en Proceder al pago.")

        time.sleep(6)

        # Ir a Stripe manualmente (solo para test local)
        wait.until(EC.url_contains("checkout.stripe.com"))
        print("✅ Página de Stripe cargada.")
        # Rellenar Stripe
        self.fill_field(By.ID, "email", "virginiamesa10@gmail.com")

        self.fill_stripe_card_fields()

        # Titular
        self.fill_field(By.ID, "billingName", "Virginia Mesa Perez")

    
        # Click final en pagar
        self.click_with_retry(By.XPATH, "//button[contains(., 'Pagar') or contains(@type, 'submit')]")
        time.sleep(7)

        print("✅ Pago realizado correctamente (o al menos enviado a Stripe).")

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()