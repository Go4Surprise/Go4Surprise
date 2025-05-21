import unittest, time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException

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

    def test_booking_flow(self):
        driver = self.driver
        wait = self.wait

        # Login
        driver.get("http://localhost:8081/LoginScreen")
        wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Nombre de usuario']"))).send_keys("Paula10")
        driver.find_element(By.XPATH, "//input[@placeholder='Contraseña']").send_keys("prueba1234")
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
            except Exception as e:
                print(f"⚠️ Error inesperado: {e}")
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

        # Esperar redirección
        time.sleep(5)
        print("✅ Reserva creada correctamente (o al menos enviada).")

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
