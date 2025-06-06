from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException
import unittest, time

class AppDynamicsJob(unittest.TestCase):
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
                element = self.wait.until(EC.presence_of_element_located((by, value)))
                self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
                time.sleep(1)  # da tiempo a que se "active"
                self.driver.execute_script("arguments[0].click();", element)
                return
            except StaleElementReferenceException:
                time.sleep(1)

    def test_app_dynamics_job(self):
        driver = self.driver
        wait = self.wait

        # Ir al registro
        driver.get("http://localhost:8081/RegisterScreen")

        # Rellenar campos
        self.fill_field_safe(By.XPATH, "(//input)[1]", "Antonio2")              # Usuario
        self.fill_field_safe(By.XPATH, "(//input)[2]", "ANTONIO123")            # Contraseña
        self.fill_field_safe(By.XPATH, "(//input)[3]", "ANTONIO123")            # Confirmar contraseña
        self.fill_field_safe(By.XPATH, "(//input)[4]", "Antonio")               # Nombre
        self.fill_field_safe(By.XPATH, "(//input)[5]", "ANTONIO")               # Apellido
        self.fill_field_safe(By.XPATH, "(//input)[6]", "virmesper@alum.us.es")  # Email
        self.fill_field_safe(By.XPATH, "(//input)[7]", "626783749")             # Teléfono

        # Fecha de nacimiento
        birth_input = wait.until(EC.presence_of_element_located((By.XPATH, "(//input)[8]")))
        driver.execute_script("""
            const input = arguments[0];
            const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setValue.call(input, arguments[1]);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        """, birth_input, "2003-06-11")

        # Selecciona el checkbox por el texto adyacente o usa el icono directamente
        checkbox = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'css-text') and contains(@class, 'userSelect')]")))
        driver.execute_script("arguments[0].click();", checkbox)


        # Click en 'Registrarse'
        self.click_with_retry(By.XPATH, "//div[contains(text(), 'Registrarse')]")

        # Esperar tras registrarse
        time.sleep(2)


    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()