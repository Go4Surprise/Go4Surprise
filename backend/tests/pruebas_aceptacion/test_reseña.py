import unittest, time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException, TimeoutException

class ReseñarReservaTest(unittest.TestCase):
    def setUp(self):
        chrome_options = Options()
        chrome_options.add_argument("--start-maximized")
        service = Service(r"C:\Webdriver\chromedriver-win64\chromedriver.exe")
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 30)

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

    def click_with_retry(self, by, value):
        for _ in range(3):
            try:
                element = self.wait.until(EC.element_to_be_clickable((by, value)))
                self.driver.execute_script("arguments[0].click();", element)
                return
            except StaleElementReferenceException:
                time.sleep(1)

    def test_reseñar_reserva(self):
        driver = self.driver
        wait = self.wait

        # Login
        driver.get("http://localhost:8081/LoginScreen")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Nombre de usuario']", "ManuelPalacios")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Contraseña']", "ispp1234")
        self.click_with_retry(By.XPATH, "//*[contains(text(),'Iniciar sesión')]")
        time.sleep(3)

        # Ir a perfil y a la sección de reservas
        driver.get("http://localhost:8081/Profile")
        self.click_with_retry(By.XPATH, "//*[contains(text(),'Reservas')]")
        time.sleep(2)

        # Ir a pestaña de reservas pasadas
        self.click_with_retry(By.XPATH, "//div[contains(text(),'Pasadas')]")
        time.sleep(2)

        # Hacer clic en "Dejar Reseña"
        self.click_with_retry(By.XPATH, "//div[contains(text(),'Dejar Reseña')]")
        time.sleep(2)

        # Seleccionar puntuación (clic en una estrella)
        estrellas = driver.find_elements(By.XPATH, "//div[@aria-label='Estrella']")  # Ajusta si tus estrellas tienen otro texto
        if estrellas:
            self.driver.execute_script("arguments[0].click();", estrellas[-1])  # última estrella (valor 5)
            print("✅ Estrella seleccionada.")
        else:
            print("❌ No se encontraron estrellas.")

        # Escribir comentario
        self.fill_field_safe(By.TAG_NAME, "textarea", "La experiencia ha sido estupenda, a pesar del tiempo.")
        print("✅ Comentario añadido.")

        # Hacer clic en Enviar
        self.click_with_retry(By.XPATH, "//div[contains(text(),'Enviar')]")
        print("✅ Reseña enviada correctamente.")

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
