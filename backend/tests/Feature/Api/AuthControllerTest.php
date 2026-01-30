<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_succeeds_for_regular_user(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->withHeader('Origin', 'http://localhost:3000')
            ->withSession([])
            ->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertOk()->assertJsonPath('user.email', $user->email);
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_rejects_admin_users(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
        ]);

        $response->assertStatus(403)->assertJson([
            'message' => 'Admins must use the Filament admin panel.',
        ]);
        $this->assertGuest();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_me_returns_user_for_authenticated_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }

    public function test_logout_clears_session(): void
    {
        $user = User::factory()->create();

        $this->withHeader('Origin', 'http://localhost:3000')
            ->withSession([])
            ->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ])
            ->assertOk();

        $this->withHeader('Origin', 'http://localhost:3000')
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJson(['ok' => true]);
    }
}
