<?php

namespace Tests\Feature\Api;

use App\Enums\TaskStatusEnum;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_scopes_tasks_to_user(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Task::factory()->count(2)->for($user)->create();
        Task::factory()->count(1)->for($other)->create();

        $response = $this->actingAs($user)->getJson('/api/tasks');

        $response->assertOk()->assertJsonCount(2, 'data');

        foreach ($response->json('data') as $row) {
            $this->assertSame($user->id, $row['user_id']);
        }
    }

    public function test_index_search_escapes_special_characters(): void
    {
        $user = User::factory()->create();

        Task::factory()->for($user)->create(['title' => '100% Ready']);
        Task::factory()->for($user)->create(['title' => '100 Ready']);

        $response = $this->actingAs($user)->getJson('/api/tasks?search='.urlencode('100%'));

        $response->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame('100% Ready', $response->json('data.0.title'));
    }

    public function test_store_sets_user_and_default_status(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/tasks', [
            'title' => 'New task',
            'description' => null,
        ]);

        $response->assertStatus(201)->assertJsonPath('user_id', $user->id);
        $response->assertJsonPath('status', TaskStatusEnum::Pending->value);

        $this->assertDatabaseHas('tasks', [
            'title' => 'New task',
            'user_id' => $user->id,
            'status' => TaskStatusEnum::Pending->value,
        ]);
    }

    public function test_show_blocks_other_users_task(): void
    {
        $user = User::factory()->create();
        $otherTask = Task::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/tasks/'.$otherTask->id)
            ->assertStatus(404);
    }

    public function test_update_and_delete_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create([
            'title' => 'Old title',
            'status' => TaskStatusEnum::Pending->value,
        ]);

        $this->actingAs($user)
            ->patchJson('/api/tasks/'.$task->id, [
                'title' => 'New title',
                'status' => TaskStatusEnum::Completed->value,
            ])
            ->assertOk();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'New title',
            'status' => TaskStatusEnum::Completed->value,
        ]);

        $this->actingAs($user)
            ->deleteJson('/api/tasks/'.$task->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_sort_by_title_ascending(): void
    {
        $user = User::factory()->create();

        Task::factory()->for($user)->create(['title' => 'BBB']);
        Task::factory()->for($user)->create(['title' => 'AAA']);

        $response = $this->actingAs($user)->getJson('/api/tasks?sort_by=title&sort_dir=asc');

        $response->assertOk();
        $this->assertSame('AAA', $response->json('data.0.title'));
    }

    public function test_per_page_validation_rejects_over_limit(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/tasks?per_page=101')
            ->assertStatus(422);
    }
}
