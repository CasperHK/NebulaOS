package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "NebulaOS Kernel",
	})

	// Health check API
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "nebula-kernel",
		})
	})

	// Proxy all non-/api/* routes to the SolidStart SSR server on port 3001
	app.Use(func(c *fiber.Ctx) error {
		return proxy.Do(c, "http://localhost:3001"+c.OriginalURL())
	})

	log.Println("NebulaOS Kernel listening on :3000")
	log.Fatal(app.Listen(":3000"))
}
