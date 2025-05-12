package com.ecommerce.backend.controller;

import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/public")
    public List<Category> getAllCategories() {
        return categoryService.getAllCategories();
    }
    
    @GetMapping("/test-auth")
    public ResponseEntity<Map<String, Object>> testAuth(Principal principal) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(Map.of(
            "principal", principal != null ? principal.getName() : "null",
            "isAuthenticated", auth.isAuthenticated(),
            "authorities", auth.getAuthorities().toString()
        ));
    }

    @PostMapping("/add")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Category addCategory(@RequestBody Category category, Principal principal) {
        System.out.println("Add category called by: " + (principal != null ? principal.getName() : "unknown"));
        System.out.println("Category to add: " + category.getName());
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Is authenticated: " + auth.isAuthenticated());
        System.out.println("Authorities: " + auth.getAuthorities());
        
        return categoryService.addCategory(category);
    }
    
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok("Category deleted successfully");
    }
}
